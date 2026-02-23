import { createHash } from 'node:crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, ok, serverError, unauthorized, notFound } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { ensureStripe } from '@/lib/integrations/stripe';
import { findGiftBrandById, isGiftDenominationAllowed } from '@/lib/integrations/tremendous';
import { absoluteUrl } from '@/lib/utils';

const checkoutSchema = z.object({
  cardId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid checkout payload', parsed.error.flatten());
    }

    const card = await prisma.card.findFirst({
      where: {
        id: parsed.data.cardId,
        userId: session.user.id
      },
      include: {
        giftCard: true,
        user: true
      }
    });

    if (!card) {
      return notFound('Card not found');
    }

    if (card.user.plan === 'FREE' && card.giftCard) {
      return badRequest('Gift cards require Premium or Pro plans.');
    }

    const cardAmount =
      card.user.plan === 'PRO'
        ? 0
        : card.tier === 'QUICK'
        ? card.user.plan === 'FREE'
          ? 0
          : 500
        : 1900;
    const giftAmount = card.giftCard?.amount || 0;

    if (!env.STRIPE_SECRET_KEY) {
      return ok({
        mode: 'mock',
        checkoutUrl: `${absoluteUrl(`/card/${card.slug}/share`)}?mockCheckout=1`,
        totalCents: cardAmount + giftAmount
      });
    }

    const stripe = ensureStripe();

    if (!card.user.stripeCustomerId && card.user.email) {
      const customer = await stripe.customers.create({
        email: card.user.email,
        name: card.user.name || undefined,
        metadata: {
          userId: card.user.id
        }
      });

      await prisma.user.update({
        where: { id: card.user.id },
        data: { stripeCustomerId: customer.id }
      });
    }

    const lineItems: Array<{
      quantity: number;
      price?: string;
      price_data?: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
    }> = [];

    if (cardAmount > 0) {
      if (env.STRIPE_PRICE_PREMIUM_CARD) {
        lineItems.push({
          quantity: 1,
          price: env.STRIPE_PRICE_PREMIUM_CARD
        });
      } else {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `LiveCardStudio ${card.tier === 'QUICK' ? 'Quick' : 'Premium'} Card`,
              description: `${card.occasion} card for ${card.recipientName}`
            },
            unit_amount: cardAmount
          }
        });
      }
    }

    if (giftAmount > 0 && card.giftCard) {
      if (!env.TREMENDOUS_API_KEY) {
        return badRequest('Gift card checkout requires Tremendous configuration.');
      }

      if (!card.giftCard.tremendousProductId) {
        return badRequest('Gift card product selection is required before checkout.');
      }

      const brand = await findGiftBrandById(card.giftCard.tremendousProductId);
      if (!brand) {
        return badRequest('Selected gift product is unavailable.');
      }

      if (!isGiftDenominationAllowed(brand, card.giftCard.amount / 100)) {
        return badRequest('Selected gift amount is not valid for the chosen brand.');
      }

      lineItems.push({
        quantity: 1,
        price_data: {
          currency: card.giftCard.currency.toLowerCase(),
          product_data: {
            name: `${card.giftCard.brand} Gift Card`,
            description: 'Digital gift card to include inside living card'
          },
          unit_amount: giftAmount
        }
      });
    }

    if (!lineItems.length) {
      return ok({
        mode: 'no_charge',
        checkoutUrl: absoluteUrl(`/card/${card.slug}/share`)
      });
    }

    const idempotencyKey = createHash('sha256')
      .update(`checkout:${card.id}:${card.user.id}:${cardAmount}:${giftAmount}`)
      .digest('hex');

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        customer: card.user.stripeCustomerId || undefined,
        metadata: {
          cardId: card.id,
          userId: card.user.id,
          slug: card.slug,
          hasGift: card.giftCard ? 'true' : 'false'
        },
        success_url: absoluteUrl(`/card/${card.slug}/share?checkout=success&session_id={CHECKOUT_SESSION_ID}`),
        cancel_url: absoluteUrl(`/create?cardId=${card.id}&checkout=cancel`),
        payment_intent_data: {
          metadata: {
            cardId: card.id,
            userId: card.user.id
          }
        }
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
