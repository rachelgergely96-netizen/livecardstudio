import { z } from 'zod';

export const occasionValues = [
  'BIRTHDAY',
  'WEDDING',
  'ENGAGEMENT',
  'ANNIVERSARY',
  'BABY_SHOWER',
  'GRADUATION',
  'VALENTINES',
  'MOTHERS_DAY',
  'FATHERS_DAY',
  'HOLIDAY',
  'NEW_YEARS',
  'THANK_YOU',
  'JUST_BECAUSE',
  'SYMPATHY',
  'CONGRATULATIONS',
  'PROMOTION'
] as const;

export const cardTierValues = [
  'QUICK',
  'PREMIUM'
] as const;

export const quickThemeValues = [
  'AURORA_DREAMS',
  'DEEP_BIOLUMINESCENCE',
  'FIREFLY_MEADOW',
  'LANTERN_FESTIVAL',
  'MIDNIGHT_RAIN',
  'SAKURA_WIND',
  'FIRST_DANCE',
  'CHAMPAGNE_TOAST',
  'RINGS_OF_LIGHT'
] as const;

export const premiumThemeValues = [
  'WATERCOLOR',
  'CELESTIAL',
  'MIDNIGHT_GARDEN',
  'BOTANICAL',
  'GOLDEN_HOUR',
  'MODERN_MINIMAL',
  'PASTEL_DREAM',
  'ETERNAL_VOW',
  'GRAND_CELEBRATION'
] as const;

export const musicStyleValues = [
  'MUSIC_BOX_BIRTHDAY',
  'AMBIENT_WARM',
  'GENTLE_PIANO',
  'CELESTIAL_PADS',
  'SOFT_GUITAR',
  'WALTZ_MUSIC_BOX',
  'FESTIVE_ORCHESTRAL',
  'ROMANTIC_HARP',
  'WIND_CHIMES',
  'NONE'
] as const;

type OccasionValue = (typeof occasionValues)[number];
type CardTierValue = (typeof cardTierValues)[number];
type QuickThemeValue = (typeof quickThemeValues)[number];
type PremiumThemeValue = (typeof premiumThemeValues)[number];

export const occasionLabels: Record<OccasionValue, string> = {
  BIRTHDAY: 'Birthday',
  WEDDING: 'Wedding',
  ENGAGEMENT: 'Engagement',
  ANNIVERSARY: 'Anniversary',
  BABY_SHOWER: 'Baby Shower',
  GRADUATION: 'Graduation',
  VALENTINES: 'Valentine\'s',
  MOTHERS_DAY: 'Mother\'s Day',
  FATHERS_DAY: 'Father\'s Day',
  HOLIDAY: 'Holiday',
  NEW_YEARS: 'New Year\'s',
  THANK_YOU: 'Thank You',
  JUST_BECAUSE: 'Just Because',
  SYMPATHY: 'Sympathy',
  CONGRATULATIONS: 'Congratulations',
  PROMOTION: 'Promotion'
};

export const cardTierLabels: Record<CardTierValue, string> = {
  QUICK: 'Quick Card',
  PREMIUM: 'Premium Card'
};

export const quickThemeLabels: Record<QuickThemeValue, string> = {
  AURORA_DREAMS: 'Aurora Dreams',
  DEEP_BIOLUMINESCENCE: 'Deep Bioluminescence',
  FIREFLY_MEADOW: 'Firefly Meadow',
  LANTERN_FESTIVAL: 'Lantern Festival',
  MIDNIGHT_RAIN: 'Midnight Rain',
  SAKURA_WIND: 'Sakura Wind',
  FIRST_DANCE: 'First Dance',
  CHAMPAGNE_TOAST: 'Champagne Toast',
  RINGS_OF_LIGHT: 'Rings of Light'
};

export const premiumThemeLabels: Record<PremiumThemeValue, string> = {
  WATERCOLOR: 'Watercolor',
  CELESTIAL: 'Celestial',
  MIDNIGHT_GARDEN: 'Midnight Garden',
  BOTANICAL: 'Botanical',
  GOLDEN_HOUR: 'Golden Hour',
  MODERN_MINIMAL: 'Modern Minimal',
  PASTEL_DREAM: 'Pastel Dream',
  ETERNAL_VOW: 'Eternal Vow',
  GRAND_CELEBRATION: 'Grand Celebration'
};

export const quickThemeCollections: Record<QuickThemeValue, 'atmospheric' | 'wedding'> = {
  AURORA_DREAMS: 'atmospheric',
  DEEP_BIOLUMINESCENCE: 'atmospheric',
  FIREFLY_MEADOW: 'atmospheric',
  LANTERN_FESTIVAL: 'atmospheric',
  MIDNIGHT_RAIN: 'atmospheric',
  SAKURA_WIND: 'atmospheric',
  FIRST_DANCE: 'wedding',
  CHAMPAGNE_TOAST: 'wedding',
  RINGS_OF_LIGHT: 'wedding'
};

export const THEME_RECOMMENDATIONS: Record<
  OccasionValue,
  { quick: QuickThemeValue[]; premium: PremiumThemeValue[] }
> = {
  BIRTHDAY: { quick: ['LANTERN_FESTIVAL', 'FIREFLY_MEADOW'], premium: ['WATERCOLOR', 'GOLDEN_HOUR'] },
  WEDDING: { quick: ['FIRST_DANCE', 'RINGS_OF_LIGHT', 'CHAMPAGNE_TOAST'], premium: ['WATERCOLOR', 'ETERNAL_VOW'] },
  ENGAGEMENT: { quick: ['RINGS_OF_LIGHT', 'CHAMPAGNE_TOAST'], premium: ['ETERNAL_VOW', 'GRAND_CELEBRATION'] },
  ANNIVERSARY: { quick: ['DEEP_BIOLUMINESCENCE', 'RINGS_OF_LIGHT'], premium: ['MIDNIGHT_GARDEN', 'ETERNAL_VOW'] },
  BABY_SHOWER: { quick: ['FIREFLY_MEADOW', 'SAKURA_WIND'], premium: ['BOTANICAL', 'PASTEL_DREAM'] },
  GRADUATION: { quick: ['LANTERN_FESTIVAL', 'AURORA_DREAMS'], premium: ['GOLDEN_HOUR', 'CELESTIAL'] },
  VALENTINES: { quick: ['MIDNIGHT_RAIN', 'FIRST_DANCE'], premium: ['MIDNIGHT_GARDEN', 'ETERNAL_VOW'] },
  MOTHERS_DAY: { quick: ['SAKURA_WIND', 'FIREFLY_MEADOW'], premium: ['BOTANICAL', 'WATERCOLOR'] },
  FATHERS_DAY: { quick: ['MIDNIGHT_RAIN', 'AURORA_DREAMS'], premium: ['MODERN_MINIMAL', 'GOLDEN_HOUR'] },
  HOLIDAY: { quick: ['LANTERN_FESTIVAL', 'CHAMPAGNE_TOAST'], premium: ['CELESTIAL', 'GRAND_CELEBRATION'] },
  NEW_YEARS: { quick: ['CHAMPAGNE_TOAST', 'LANTERN_FESTIVAL'], premium: ['GRAND_CELEBRATION', 'CELESTIAL'] },
  THANK_YOU: { quick: ['FIREFLY_MEADOW', 'SAKURA_WIND'], premium: ['WATERCOLOR', 'BOTANICAL'] },
  JUST_BECAUSE: { quick: ['AURORA_DREAMS', 'FIREFLY_MEADOW'], premium: ['WATERCOLOR', 'CELESTIAL'] },
  SYMPATHY: { quick: ['SAKURA_WIND', 'MIDNIGHT_RAIN'], premium: ['WATERCOLOR', 'MODERN_MINIMAL'] },
  CONGRATULATIONS: { quick: ['CHAMPAGNE_TOAST', 'LANTERN_FESTIVAL'], premium: ['GRAND_CELEBRATION', 'GOLDEN_HOUR'] },
  PROMOTION: { quick: ['CHAMPAGNE_TOAST', 'LANTERN_FESTIVAL'], premium: ['GRAND_CELEBRATION', 'GOLDEN_HOUR'] }
};

export function getOccasionRecommendations(occasion: OccasionValue) {
  return THEME_RECOMMENDATIONS[occasion] || THEME_RECOMMENDATIONS.BIRTHDAY;
}

export function getDefaultQuickTheme(occasion: OccasionValue): QuickThemeValue {
  return getOccasionRecommendations(occasion).quick[0] || 'AURORA_DREAMS';
}

export function getDefaultPremiumTheme(occasion: OccasionValue): PremiumThemeValue {
  return getOccasionRecommendations(occasion).premium[0] || 'WATERCOLOR';
}

export function resolveThemeLabel(selection: {
  tier: CardTierValue;
  quickTheme?: QuickThemeValue | null;
  premiumTheme?: PremiumThemeValue | null;
}) {
  if (selection.tier === 'QUICK') {
    return selection.quickTheme ? quickThemeLabels[selection.quickTheme] : 'Quick Theme';
  }
  return selection.premiumTheme ? premiumThemeLabels[selection.premiumTheme] : 'Premium Theme';
}

export const cardFeatureSchema = z.object({
  photoInteractions: z.boolean().default(true),
  brushReveal: z.boolean().default(true),
  paintCanvas: z.boolean().default(true),
  confettiFinale: z.boolean().default(true)
});

export type CardFeatures = z.infer<typeof cardFeatureSchema>;

export const defaultCardFeatures: CardFeatures = {
  photoInteractions: true,
  brushReveal: true,
  paintCanvas: true,
  confettiFinale: true
};

export const cardPayloadSchema = z
  .object({
    title: z.string().min(2).max(120),
    recipientName: z.string().min(1).max(80),
    occasion: z.enum(occasionValues),
    tier: z.enum(cardTierValues).default('QUICK'),
    quickTheme: z.enum(quickThemeValues).optional(),
    premiumTheme: z.enum(premiumThemeValues).optional(),
    message: z.string().min(1).max(10000),
    sectionMessages: z.array(z.string().max(280)).optional(),
    musicStyle: z.enum(musicStyleValues).default('NONE'),
    featureToggles: cardFeatureSchema.default(defaultCardFeatures),
    giftCard: z
      .object({
        brand: z.string().min(1).max(120),
        amount: z.number().int().min(100),
        currency: z.string().length(3).default('USD')
      })
      .optional()
  })
  .superRefine((value, ctx) => {
    if (value.tier === 'QUICK' && !value.quickTheme) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quickTheme'],
        message: 'A quick theme is required for quick cards.'
      });
    }

    if (value.tier === 'PREMIUM' && !value.premiumTheme) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['premiumTheme'],
        message: 'A premium theme is required for premium cards.'
      });
    }
  });

export type CardPayload = z.infer<typeof cardPayloadSchema>;
