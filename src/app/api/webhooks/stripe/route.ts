import { CardStatus, GiftCardStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { regenerateCardHtml } from '@/lib/cards/publish';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { sendAdminAlert, sendEmail } from '@/lib/integrations/email';
import { ensureStripe } from '@/lib/integrations/stripe';
import { purchaseGiftCard } from '@/lib/integrations/tremendous';
import { absoluteUrl } from '@/lib/utils';

export const runtime = 'nodejs';

type StripeCheckoutSession = {
  id: string;
  metadata?: Record<string, string | undefined>;
  payment_intent?: string | { id?: string } | null;
};

function getPaymentIntentId(session: StripeCheckoutSession) {
  if (typeof session.payment_intent === 'string') {
    return session.payment_intent;
  }
  if (session.payment_intent && typeof session.payment_intent === 'object') {
    return session.payment_intent.id || null;
  }
  return null;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
}

async function beginWebhookEvent(event: { id: string; type: string; created: number; livemode: boolean }) {
  const details = {
    type: event.type,
    created: event.created,
    livemode: event.livemode
  };

  try {
    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { eventId: event.id }
    });

    if (existing?.status === 'PROCESSED') {
      return { skip: true as const };
    }

    if (existing) {
      await prisma.stripeWebhookEvent.update({
        where: { id: existing.id },
        data: {
          status: 'PROCESSING',
          details,
          processedAt: null
        }
      });
      return { skip: false as const };
    }

    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'PROCESSING',
        details
      }
    });

    return { skip: false as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.stripeWebhookEvent.findUnique({
        where: { eventId: event.id }
      });

      if (existing?.status === 'PROCESSED') {
        return { skip: true as const };
      }

      if (existing) {
        await prisma.stripeWebhookEvent.update({
          where: { id: existing.id },
          data: {
            status: 'PROCESSING',
            details,
            processedAt: null
          }
        });
      }

      return { skip: false as const };
    }

    throw error;
  }
}

async function markWebhookEventProcessed(eventId: string, details?: unknown) {
  await prisma.stripeWebhookEvent.update({
    where: { eventId },
    data: {
      status: 'PROCESSED',
      processedAt: new Date(),
      details: details ?? undefined
    }
  });
}

async function markWebhookEventFailed(eventId: string, error: unknown) {
  await prisma.stripeWebhookEvent.update({
    where: { eventId },
    data: {
      status: 'FAILED',
      details: serializeError(error)
    }
  });
}

async function sendCardReadyEmail(args: { to: string; recipientName: string; slug: string }) {
  const shareUrl = absoluteUrl(`/card/${args.slug}/share`);
  await sendEmail({
    to: args.to,
    subject: 'Your LiveCardStudio card is ready to send',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
        <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
          <h1 style="margin:0 0 12px;font-size:28px;">Your card is ready</h1>
          <p style="font-size:16px;line-height:1.55;color:#5a4a3f;">Your living card for ${args.recipientName} is now published and ready to share.</p>
          <a href="${shareUrl}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#c87941;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Open share page</a>
        </div>
      </div>
    `,
    text: `Your card is ready: ${shareUrl}`
  });
}

async function handleCheckoutCompleted(checkoutSession: StripeCheckoutSession) {
  const cardId = checkoutSession.metadata?.cardId;
  if (!cardId) {
    return;
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      giftCard: true,
      user: true
    }
  });

  if (!card) {
    return;
  }

  const paymentIntentId = getPaymentIntentId(checkoutSession);
  const alreadyPublished = card.status === CardStatus.PUBLISHED;

  if (alreadyPublished && (!paymentIntentId || card.stripePaymentId === paymentIntentId)) {
    return;
  }

  await prisma.card.update({
    where: { id: card.id },
    data: {
      status: CardStatus.PAID,
      paidAt: card.paidAt || new Date(),
      stripePaymentId: paymentIntentId || card.stripePaymentId
    }
  });

  if (
    card.giftCard &&
    card.giftCard.tremendousProductId &&
    !card.giftCard.redemptionUrl &&
    card.giftCard.status !== GiftCardStatus.PURCHASED
  ) {
    try {
      const purchase = await purchaseGiftCard({
        productId: card.giftCard.tremendousProductId,
        recipientName: card.recipientName,
        denominationUsd: card.giftCard.amount / 100
      });

      await prisma.giftCard.update({
        where: { id: card.giftCard.id },
        data: {
          status: GiftCardStatus.PURCHASED,
          purchasedAt: new Date(),
          tremendousOrderId: purchase.orderId,
          redemptionUrl: purchase.redemptionUrl,
          redemptionCode: purchase.redemptionCode
        }
      });
    } catch (giftError) {
      const giftErrorMeta = {
        cardId: card.id,
        giftCardId: card.giftCard.id,
        productId: card.giftCard.tremendousProductId,
        denomination: card.giftCard.amount / 100,
        error: serializeError(giftError)
      };

      console.error('Gift purchase failed', giftErrorMeta);

      await prisma.giftCard.update({
        where: { id: card.giftCard.id },
        data: {
          status: GiftCardStatus.FAILED
        }
      });

      if (paymentIntentId) {
        try {
          const stripe = ensureStripe();
          await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: card.giftCard.amount,
            reason: 'requested_by_customer',
            metadata: {
              cardId: card.id,
              reason: 'gift_purchase_failed'
            }
          });
        } catch (refundError) {
          console.error('Gift refund failed', {
            ...giftErrorMeta,
            refundError: serializeError(refundError)
          });
        }
      }

      await sendAdminAlert({
        subject: 'Gift purchase failed and refund attempted',
        summary: `Gift purchase failed for card ${card.id}. The gift card was marked FAILED and a refund was attempted when possible.`,
        details: giftErrorMeta
      });
    }
  }

  try {
    await regenerateCardHtml(card.id, {
      status: CardStatus.PUBLISHED,
      markPublishedAt: true
    });
  } catch (publishError) {
    const retryAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.card.update({
      where: { id: card.id },
      data: {
        status: CardStatus.PAID,
        publishRetryCount: { increment: 1 },
        publishRetryAt: retryAt,
        publishError:
          publishError instanceof Error ? publishError.message.slice(0, 1000) : String(publishError).slice(0, 1000)
      }
    });

    await sendAdminAlert({
      subject: 'Card publish failed after payment',
      summary: `Card ${card.id} payment completed but publish step failed. Marked for retry at ${retryAt.toISOString()}.`,
      details: {
        cardId: card.id,
        slug: card.slug,
        error: serializeError(publishError)
      }
    });

    throw publishError;
  }

  if (card.user.email && !alreadyPublished) {
    await sendCardReadyEmail({
      to: card.user.email,
      recipientName: card.recipientName,
      slug: card.slug
    });
  }
}

export async function POST(request: Request) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 400 });
    }

    const stripe = ensureStripe();
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const gate = await beginWebhookEvent({
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode
    });

    if (gate.skip) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      await handleCheckoutCompleted(event.data.object as StripeCheckoutSession);
      await markWebhookEventProcessed(event.id, {
        checkoutSessionId: (event.data.object as StripeCheckoutSession).id
      });
      return NextResponse.json({ received: true });
    } catch (handlerError) {
      await markWebhookEventFailed(event.id, handlerError);
      console.error(handlerError);
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
