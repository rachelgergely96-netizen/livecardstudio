import { CardStatus, Occasion, CardTier, QuickTheme, PremiumTheme, MusicStyle } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, created, serverError, unauthorized, ok } from '@/lib/api';
import { canAccessPremiumThemes, canUseGiftCards } from '@/lib/billing/pricing';
import { createCardSlug } from '@/lib/cards/slug';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { findGiftBrandById, isGiftDenominationAllowed } from '@/lib/integrations/tremendous';
import { getDefaultPremiumTheme, getDefaultQuickTheme } from '@/types/card';

const createCardSchema = z.object({
  title: z.string().min(2).max(120),
  recipientName: z.string().min(1).max(80),
  occasion: z.nativeEnum(Occasion),
  tier: z.nativeEnum(CardTier).default(CardTier.QUICK),
  quickTheme: z.nativeEnum(QuickTheme).optional(),
  premiumTheme: z.nativeEnum(PremiumTheme).optional(),
  message: z.string().min(1).max(10000).default(''),
  sectionMessages: z.array(z.string().max(280)).optional(),
  musicStyle: z.nativeEnum(MusicStyle).default(MusicStyle.NONE),
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
  giftCard: z
    .object({
      brand: z.string().min(1).max(100),
      tremendousProductId: z.string().min(1).optional(),
      amount: z.number().int().min(100),
      currency: z.string().length(3).default('USD')
    })
    .optional()
}).superRefine((value, ctx) => {
  if (value.tier === CardTier.QUICK && !value.quickTheme) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quickTheme'],
      message: 'Quick cards require a quick theme.'
    });
  }

  if (value.tier === CardTier.PREMIUM && !value.premiumTheme) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['premiumTheme'],
      message: 'Premium cards require a premium theme.'
    });
  }
});

function resolveThemeSelection(payload: z.infer<typeof createCardSchema>) {
  if (payload.tier === CardTier.QUICK) {
    return {
      quickTheme: payload.quickTheme || (getDefaultQuickTheme(payload.occasion) as QuickTheme),
      premiumTheme: null
    };
  }

  return {
    quickTheme: null,
    premiumTheme: payload.premiumTheme || (getDefaultPremiumTheme(payload.occasion) as PremiumTheme)
  };
}

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
    const resolvedThemes = resolveThemeSelection(payload);
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    });
    const userPlan = userRecord?.plan || session.user.plan;

    if (!canAccessPremiumThemes(userPlan) && payload.tier === CardTier.PREMIUM) {
      return badRequest('Premium themes require Premium or Pro plans.');
    }

    if (!canUseGiftCards(userPlan) && payload.giftCard) {
      return badRequest('Gift cards require Premium or Pro plans.');
    }

    if (payload.giftCard?.tremendousProductId && env.TREMENDOUS_API_KEY) {
      const product = await findGiftBrandById(payload.giftCard.tremendousProductId);
      if (!product) {
        return badRequest('Selected gift product is unavailable.');
      }
      if (!isGiftDenominationAllowed(product, payload.giftCard.amount / 100)) {
        return badRequest('Selected gift amount is not valid for this brand.');
      }
    }

    const card = await prisma.card.create({
      data: {
        slug,
        userId: session.user.id,
        title: payload.title,
        recipientName: payload.recipientName,
        occasion: payload.occasion,
        tier: payload.tier,
        quickTheme: resolvedThemes.quickTheme,
        premiumTheme: resolvedThemes.premiumTheme,
        message: payload.message,
        sectionMessages: payload.sectionMessages || [],
        musicStyle: payload.musicStyle,
        featureToggles: payload.featureToggles,
        notifyOnFirstView: payload.notifyOnFirstView ?? false,
        notifyEmail: payload.notifyEmail ?? null,
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
