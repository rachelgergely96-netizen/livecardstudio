import { CardStatus, Occasion, Theme, MusicStyle } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, created, serverError, unauthorized, ok } from '@/lib/api';
import { createCardSlug } from '@/lib/cards/slug';
import { prisma } from '@/lib/db/prisma';

const createCardSchema = z.object({
  title: z.string().min(2).max(120),
  recipientName: z.string().min(1).max(80),
  occasion: z.nativeEnum(Occasion),
  theme: z.nativeEnum(Theme).default(Theme.WATERCOLOR),
  message: z.string().min(1).max(10000).default(''),
  sectionMessages: z.array(z.string().max(280)).optional(),
  musicStyle: z.nativeEnum(MusicStyle).default(MusicStyle.MUSIC_BOX_BIRTHDAY),
  featureToggles: z
    .object({
      photoInteractions: z.boolean(),
      brushReveal: z.boolean(),
      paintCanvas: z.boolean(),
      confettiFinale: z.boolean()
    })
    .optional(),
  giftCard: z
    .object({
      brand: z.string().min(1).max(100),
      tremendousProductId: z.string().min(1).optional(),
      amount: z.number().int().min(100),
      currency: z.string().length(3).default('USD')
    })
    .optional()
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const [cards, totalViews, sentThisMonth] = await Promise.all([
      prisma.card.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          photos: {
            select: { id: true, base64Data: true, processedUrl: true, originalUrl: true },
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          giftCard: {
            select: { amount: true, brand: true, status: true }
          }
        }
      }),
      prisma.card.aggregate({
        _sum: { viewCount: true },
        where: { userId: session.user.id }
      }),
      prisma.card.count({
        where: {
          userId: session.user.id,
          publishedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return ok({
      cards,
      stats: {
        totalCards: cards.length,
        totalViews: totalViews._sum.viewCount || 0,
        cardsSentThisMonth: sentThisMonth
      }
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid card payload', parsed.error.flatten());
    }

    const payload = parsed.data;
    const slug = createCardSlug(`${payload.occasion}-${payload.recipientName}`);

    const card = await prisma.card.create({
      data: {
        slug,
        userId: session.user.id,
        title: payload.title,
        recipientName: payload.recipientName,
        occasion: payload.occasion,
        theme: payload.theme,
        message: payload.message,
        sectionMessages: payload.sectionMessages || [],
        musicStyle: payload.musicStyle,
        featureToggles: payload.featureToggles,
        status: CardStatus.DRAFT,
        giftCard: payload.giftCard
          ? {
              create: {
                brand: payload.giftCard.brand,
                tremendousProductId: payload.giftCard.tremendousProductId,
                amount: payload.giftCard.amount,
                currency: payload.giftCard.currency,
                status: 'PENDING'
              }
            }
          : undefined
      },
      include: {
        photos: true,
        giftCard: true
      }
    });

    return created({ card });
  } catch (error) {
    return serverError(error);
  }
}
