import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { findGiftBrandById, isGiftDenominationAllowed, purchaseGiftCard } from '@/lib/integrations/tremendous';

const purchaseSchema = z.object({
  cardId: z.string().min(1),
  productId: z.string().min(1),
  denominationUsd: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid gift purchase payload', parsed.error.flatten());
    }

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, userId: session.user.id },
      include: { giftCard: true }
    });

    if (!card) {
      return notFound('Card not found');
    }

    if (!card.giftCard) {
      return badRequest('Card does not include a gift card slot yet.');
    }

    if (!env.TREMENDOUS_API_KEY) {
      return badRequest('Tremendous API is not configured.');
    }

    const brand = await findGiftBrandById(parsed.data.productId);
    if (!brand) {
      return badRequest('Selected gift product is unavailable.');
    }

    if (!isGiftDenominationAllowed(brand, parsed.data.denominationUsd)) {
      return badRequest('Selected denomination is not valid for this gift product.');
    }

    const purchase = await purchaseGiftCard({
      productId: parsed.data.productId,
      recipientName: card.recipientName,
      denominationUsd: parsed.data.denominationUsd
    });

    const updated = await prisma.giftCard.update({
      where: { id: card.giftCard.id },
      data: {
        tremendousProductId: parsed.data.productId,
        tremendousOrderId: purchase.orderId,
        redemptionUrl: purchase.redemptionUrl,
        redemptionCode: purchase.redemptionCode,
        purchasedAt: new Date(),
        status: 'PURCHASED'
      }
    });

    return ok({ giftCard: updated });
  } catch (error) {
    return serverError(error);
  }
}
