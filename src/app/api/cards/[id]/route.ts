import { CardStatus, Occasion, Theme, MusicStyle } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { findGiftBrandById, isGiftDenominationAllowed } from '@/lib/integrations/tremendous';

const updateCardSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  recipientName: z.string().min(1).max(80).optional(),
  occasion: z.nativeEnum(Occasion).optional(),
  theme: z.nativeEnum(Theme).optional(),
  message: z.string().min(1).max(10000).optional(),
  sectionMessages: z.array(z.string().max(280)).optional(),
  musicStyle: z.nativeEnum(MusicStyle).optional(),
  featureToggles: z
    .object({
      photoInteractions: z.boolean(),
      brushReveal: z.boolean(),
      paintCanvas: z.boolean(),
      confettiFinale: z.boolean()
    })
    .optional(),
  notifyOnFirstView: z.boolean().optional(),
  notifyEmail: z.string().email().nullable().optional(),
  status: z.nativeEnum(CardStatus).optional(),
  giftCard: z
    .object({
      brand: z.string().min(1).max(100),
      tremendousProductId: z.string().min(1).optional(),
      amount: z.number().int().min(100),
      currency: z.string().length(3).default('USD')
    })
    .nullable()
    .optional()
});

async function getOwnedCard(userId: string, cardId: string) {
  return prisma.card.findFirst({
    where: {
      id: cardId,
      userId
    }
  });
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const card = await prisma.card.findFirst({
      where: {
        id: context.params.id,
        userId: session.user.id
      },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        giftCard: true
      }
    });

    if (!card) return notFound('Card not found');

    return ok({ card });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const existing = await getOwnedCard(session.user.id, context.params.id);
    if (!existing) return notFound('Card not found');

    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid card update payload', parsed.error.flatten());
    }

    const payload = parsed.data;

    if (payload.giftCard?.tremendousProductId && env.TREMENDOUS_API_KEY) {
      const product = await findGiftBrandById(payload.giftCard.tremendousProductId);
      if (!product) {
        return badRequest('Selected gift product is unavailable.');
      }
      if (!isGiftDenominationAllowed(product, payload.giftCard.amount / 100)) {
        return badRequest('Selected gift amount is not valid for this brand.');
      }
    }

    const updated = await prisma.card.update({
      where: { id: existing.id },
      data: {
        title: payload.title,
        recipientName: payload.recipientName,
        occasion: payload.occasion,
        theme: payload.theme,
        message: payload.message,
        sectionMessages: payload.sectionMessages,
        musicStyle: payload.musicStyle,
        featureToggles: payload.featureToggles,
        notifyOnFirstView: payload.notifyOnFirstView,
        notifyEmail: payload.notifyEmail,
        status: payload.status,
        giftCard:
          payload.giftCard === undefined
            ? undefined
            : payload.giftCard === null
            ? { delete: true }
            : {
                upsert: {
                  update: {
                    brand: payload.giftCard.brand,
                    tremendousProductId: payload.giftCard.tremendousProductId,
                    amount: payload.giftCard.amount,
                    currency: payload.giftCard.currency
                  },
                  create: {
                    brand: payload.giftCard.brand,
                    tremendousProductId: payload.giftCard.tremendousProductId,
                    amount: payload.giftCard.amount,
                    currency: payload.giftCard.currency,
                    status: 'PENDING'
                  }
                }
              }
      },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        giftCard: true
      }
    });

    return ok({ card: updated });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const existing = await getOwnedCard(session.user.id, context.params.id);
    if (!existing) return notFound('Card not found');

    await prisma.card.delete({ where: { id: existing.id } });

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
