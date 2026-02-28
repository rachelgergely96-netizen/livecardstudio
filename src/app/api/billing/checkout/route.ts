import { createHash } from 'node:crypto';
import { Plan } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { canUpgradeTo } from '@/lib/billing/pricing';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { ensureStripe } from '@/lib/integrations/stripe';
import { absoluteUrl } from '@/lib/utils';

const planCheckoutSchema = z.object({
  targetPlan: z.enum(['PREMIUM', 'PRO'])
});

function getPlanPriceId(plan: 'PREMIUM' | 'PRO') {
  if (plan === 'PREMIUM') {
    return env.STRIPE_PRICE_PREMIUM_MONTHLY;
  }
  return env.STRIPE_PRICE_PRO_MONTHLY;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = planCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid billing payload', parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeCustomerId: true
      }
    });

    if (!user) {
      return notFound('User not found');
    }

    const targetPlan = parsed.data.targetPlan as Plan;
    if (!canUpgradeTo(user.plan, targetPlan)) {
      return badRequest(`Cannot upgrade from ${user.plan} to ${targetPlan}.`);
    }

    if (!env.STRIPE_SECRET_KEY) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: targetPlan }
      });

      return ok({
        mode: 'mock',
        checkoutUrl: absoluteUrl('/dashboard?upgrade=mock'),
        plan: targetPlan
      });
    }

    const priceId = getPlanPriceId(targetPlan as 'PREMIUM' | 'PRO');
    if (!priceId) {
      return badRequest(`Missing Stripe price ID for ${targetPlan} plan.`);
    }

    const stripe = ensureStripe();
    let stripeCustomerId = user.stripeCustomerId || undefined;

    if (!stripeCustomerId && user.email) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    const idempotencyKey = createHash('sha256')
      .update(`plan-upgrade:${user.id}:${user.plan}:${targetPlan}`)
      .digest('hex');

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: stripeCustomerId,
        customer_email: stripeCustomerId ? undefined : user.email || undefined,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        metadata: {
          purpose: 'plan_upgrade',
          userId: user.id,
          targetPlan
        },
        subscription_data: {
          metadata: {
            purpose: 'plan_upgrade',
            userId: user.id,
            targetPlan
          }
        },
        allow_promotion_codes: true,
        success_url: absoluteUrl('/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}'),
        cancel_url: absoluteUrl('/pricing?upgrade=cancel')
      },
      {
        idempotencyKey
      }
    );

    return ok({
      mode: 'stripe',
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url
    });
  } catch (error) {
    return serverError(error);
  }
}

