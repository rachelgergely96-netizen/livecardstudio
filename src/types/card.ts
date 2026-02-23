import { z } from 'zod';

export const occasionValues = [
  'BIRTHDAY',
  'WEDDING',
  'ANNIVERSARY',
  'BABY_SHOWER',
  'GRADUATION',
  'VALENTINES',
  'MOTHERS_DAY',
  'FATHERS_DAY',
  'HOLIDAY',
  'THANK_YOU',
  'JUST_BECAUSE',
  'SYMPATHY',
  'CONGRATULATIONS'
] as const;

export const themeValues = [
  'WATERCOLOR',
  'CELESTIAL',
  'MODERN_MINIMAL',
  'BOTANICAL',
  'VINTAGE_FILM',
  'GOLDEN_HOUR',
  'MIDNIGHT_GARDEN',
  'PASTEL_DREAM'
] as const;

export const musicStyleValues = [
  'MUSIC_BOX_BIRTHDAY',
  'AMBIENT_WARM',
  'GENTLE_PIANO',
  'CELESTIAL_PADS',
  'SOFT_GUITAR',
  'NONE'
] as const;

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

export const cardPayloadSchema = z.object({
  title: z.string().min(2).max(120),
  recipientName: z.string().min(1).max(80),
  occasion: z.enum(occasionValues),
  theme: z.enum(themeValues).default('WATERCOLOR'),
  message: z.string().min(1).max(10000),
  sectionMessages: z.array(z.string().max(280)).optional(),
  musicStyle: z.enum(musicStyleValues).default('MUSIC_BOX_BIRTHDAY'),
  featureToggles: cardFeatureSchema.default(defaultCardFeatures),
  giftCard: z
    .object({
      brand: z.string().min(1).max(120),
      amount: z.number().int().min(100),
      currency: z.string().length(3).default('USD')
    })
    .optional()
});

export type CardPayload = z.infer<typeof cardPayloadSchema>;

export const occasionLabels: Record<(typeof occasionValues)[number], string> = {
  BIRTHDAY: 'Birthday',
  WEDDING: 'Wedding',
  ANNIVERSARY: 'Anniversary',
  BABY_SHOWER: 'Baby Shower',
  GRADUATION: 'Graduation',
  VALENTINES: 'Valentine\'s',
  MOTHERS_DAY: 'Mother\'s Day',
  FATHERS_DAY: 'Father\'s Day',
  HOLIDAY: 'Holiday',
  THANK_YOU: 'Thank You',
  JUST_BECAUSE: 'Just Because',
  SYMPATHY: 'Sympathy',
  CONGRATULATIONS: 'Congratulations'
};

export const themeLabels: Record<(typeof themeValues)[number], string> = {
  WATERCOLOR: 'Watercolor',
  CELESTIAL: 'Celestial',
  MODERN_MINIMAL: 'Modern Minimal',
  BOTANICAL: 'Botanical',
  VINTAGE_FILM: 'Vintage Film',
  GOLDEN_HOUR: 'Golden Hour',
  MIDNIGHT_GARDEN: 'Midnight Garden',
  PASTEL_DREAM: 'Pastel Dream'
};
