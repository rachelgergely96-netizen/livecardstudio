import { CardTier, Occasion, PremiumTheme, QuickTheme } from '@prisma/client';
import { premiumThemeLabels, quickThemeLabels } from '@/types/card';
import { buildCreateThemeUrl, buildThemePreviewUrl, type CreateThemePreset } from '@/lib/themes/presets';

export type ThemeDemoItem = {
  id: string;
  tier: CardTier;
  occasion: Occasion;
  quickTheme?: QuickTheme;
  premiumTheme?: PremiumTheme;
  collection: string;
  description: string;
  swatch: [string, string];
};

export const BUILT_THEME_DEMOS: ThemeDemoItem[] = [
  {
    id: 'aurora-dreams',
    tier: 'QUICK',
    quickTheme: 'AURORA_DREAMS',
    occasion: 'JUST_BECAUSE',
    collection: 'Atmospheric',
    description: 'Northern lights, frozen glow, and soft snowfall for long-distance love.',
    swatch: ['#0A0E1A', '#60A8D0']
  },
  {
    id: 'deep-bioluminescence',
    tier: 'QUICK',
    quickTheme: 'DEEP_BIOLUMINESCENCE',
    occasion: 'ANNIVERSARY',
    collection: 'Atmospheric',
    description: 'Luminous ocean atmosphere with jellyfish drift and deep cyan highlights.',
    swatch: ['#04081A', '#50B4DC']
  },
  {
    id: 'firefly-meadow',
    tier: 'QUICK',
    quickTheme: 'FIREFLY_MEADOW',
    occasion: 'JUST_BECAUSE',
    collection: 'Atmospheric',
    description: 'Warm dusk fireflies for nostalgic summer nights and heartfelt notes.',
    swatch: ['#1A1E2E', '#C8D88C']
  },
  {
    id: 'lantern-festival',
    tier: 'QUICK',
    quickTheme: 'LANTERN_FESTIVAL',
    occasion: 'BIRTHDAY',
    collection: 'Atmospheric',
    description: 'Floating lanterns and amber sparks for celebrations and wishes.',
    swatch: ['#1A1420', '#E8B464']
  },
  {
    id: 'midnight-rain',
    tier: 'QUICK',
    quickTheme: 'MIDNIGHT_RAIN',
    occasion: 'SYMPATHY',
    collection: 'Atmospheric',
    description: 'Rainfall, mist, and moody tones for reflective and emotional moments.',
    swatch: ['#181B22', '#7B9CB8']
  },
  {
    id: 'sakura-wind',
    tier: 'QUICK',
    quickTheme: 'SAKURA_WIND',
    occasion: 'MOTHERS_DAY',
    collection: 'Atmospheric',
    description: 'Light parchment and drifting petals with elegant spring movement.',
    swatch: ['#F5F0E8', '#D4919B']
  },
  {
    id: 'first-dance',
    tier: 'QUICK',
    quickTheme: 'FIRST_DANCE',
    occasion: 'WEDDING',
    collection: 'Wedding',
    description: 'String lights, rose petals, and first-dance romance.',
    swatch: ['#0A0812', '#F1B28D']
  },
  {
    id: 'champagne-toast',
    tier: 'QUICK',
    quickTheme: 'CHAMPAGNE_TOAST',
    occasion: 'WEDDING',
    collection: 'Wedding',
    description: 'Champagne flutes, fizz, and gold confetti with celebration energy.',
    swatch: ['#0A0812', '#E8C87A']
  },
  {
    id: 'rings-of-light',
    tier: 'QUICK',
    quickTheme: 'RINGS_OF_LIGHT',
    occasion: 'ENGAGEMENT',
    collection: 'Wedding',
    description: 'Interlocking rings, prismatic rays, and diamond light effects.',
    swatch: ['#050510', '#BCA9F7']
  },
  {
    id: 'watercolor',
    tier: 'PREMIUM',
    premiumTheme: 'WATERCOLOR',
    occasion: 'BIRTHDAY',
    collection: 'Premium Story',
    description: 'Scrolling multi-photo story with paint overlay, music, and finale moments.',
    swatch: ['#FAF7F2', '#D99CB5']
  }
];

export function getThemeDemoPreset(item: ThemeDemoItem): CreateThemePreset {
  return {
    tier: item.tier,
    occasion: item.occasion,
    quickTheme: item.quickTheme,
    premiumTheme: item.premiumTheme
  };
}

export function getThemeDemoName(item: ThemeDemoItem) {
  if (item.tier === 'QUICK' && item.quickTheme) {
    return quickThemeLabels[item.quickTheme];
  }
  if (item.tier === 'PREMIUM' && item.premiumTheme) {
    return premiumThemeLabels[item.premiumTheme];
  }
  return 'Theme';
}

export function getThemeDemoStartUrl(item: ThemeDemoItem) {
  return buildCreateThemeUrl(getThemeDemoPreset(item));
}

export function getThemeDemoPreviewUrl(item: ThemeDemoItem) {
  return buildThemePreviewUrl(getThemeDemoPreset(item));
}

