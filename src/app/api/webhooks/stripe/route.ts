import { CardStatus, GiftCardStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { regenerateCardHtml } from '@/lib/cards/publish';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/integrations/email';
import { ensureStripe } from '@/lib/integrations/stripe';
import { purchaseGiftCard } from '@/lib/integrations/tremendous';
import { absoluteUrl } from '@/lib/utils';

export const runtime = 'nodejs';

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

    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object;
      const cardId = checkoutSession.metadata?.cardId;

      if (cardId) {
        const card = await prisma.card.findUnique({
          where: { id: cardId },
          include: {
            giftCard: true,
            user: true
          }
        });

        if (card) {
          await prisma.card.update({
            where: { id: card.id },
            data: {
              status: CardStatus.PAID,
              paidAt: new Date(),
              stripePaymentId: typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : null
            }
          });

          if (card.giftCard && card.giftCard.tremendousProductId && !card.giftCard.redemptionUrl) {
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
              console.error('Gift purchase failed', giftError);
              await prisma.giftCard.update({
                where: { id: card.giftCard.id },
                data: {
                  status: GiftCardStatus.FAILED
                }
              });

              if (typeof checkoutSession.payment_intent === 'string') {
                try {
                  await stripe.refunds.create({
                    payment_intent: checkoutSession.payment_intent,
                    amount: card.giftCard.amount,
                    reason: 'requested_by_customer',
                    metadata: {
                      cardId: card.id,
                      reason: 'gift_purchase_failed'
                    }
                  });
                } catch (refundError) {
                  console.error('Gift refund failed', refundError);
                }
              }
            }
          }

          await regenerateCardHtml(card.id, {
            status: CardStatus.PUBLISHED,
            markPublishedAt: true
          });

          if (card.user.email) {
            const shareUrl = absoluteUrl(`/card/${card.slug}/share`);
            await sendEmail({
              to: card.user.email,
              subject: 'Your LiveCardStudio card is ready to send',
              html: `
                <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
                  <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
                    <h1 style="margin:0 0 12px;font-size:28px;">Your card is ready</h1>
                    <p style="font-size:16px;line-height:1.55;color:#5a4a3f;">Your living card for ${card.recipientName} is now published and ready to share.</p>
                    <a href="${shareUrl}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#c87941;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Open share page</a>
                  </div>
                </div>
              `,
              text: `Your card is ready: ${shareUrl}`
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
