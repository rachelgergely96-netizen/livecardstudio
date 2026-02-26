import { CardTier, Occasion, PremiumTheme, QuickTheme } from '@prisma/client';
import { premiumThemeLabels, premiumThemeValues, quickThemeLabels } from '@/types/card';
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

const QUICK_THEME_DEMOS: ThemeDemoItem[] = [
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
  }
];

const PREMIUM_THEME_SWATCH: Partial<Record<PremiumTheme, [string, string]>> = {
  WATERCOLOR: ['#FAF7F2', '#D99CB5'],
  CELESTIAL: ['#08071E', '#C9A0FF'],
  MIDNIGHT_GARDEN: ['#041208', '#00E8A0'],
  BOTANICAL: ['#E8F3E8', '#6EA86A'],
  GOLDEN_HOUR: ['#2A1808', '#FFD86B'],
  MODERN_MINIMAL: ['#0F0F14', '#E0E0E8'],
  PASTEL_DREAM: ['#FBEAF3', '#D4B8DC'],
  ETERNAL_VOW: ['#1A101A', '#E8B0C0'],
  GRAND_CELEBRATION: ['#190E09', '#FFB347'],
  VELVET_NOIR: ['#140C1A', '#7A5A94'],
  OCEAN_DEPTHS: ['#05101B', '#4AA4D6'],
  AUTUMN_EMBER: ['#2B160E', '#C97D42'],
  SAKURA_REVERIE: ['#F8E9EE', '#D98CA7'],
  NORTHERN_LIGHTS: ['#06111E', '#5FD9BC'],
  NEON_TOKYO: ['#100C1C', '#00E4FF'],
  BIOLUMINESCENT_OCEAN: ['#05101D', '#48CFE2'],
  NEBULA_GALAXY: ['#130A23', '#8E71E8'],
  ENCHANTED_FOREST: ['#07150E', '#5DB387'],
  VOLCANIC_EMBER: ['#260E0B', '#E3703C'],
  ZEN_GARDEN: ['#F4F0E6', '#97B08A'],
  ETERNAL_GARDEN: ['#0E1A13', '#7AB889'],
  STARLIT_VOWS: ['#161126', '#C8AEDC'],
  WRITTEN_IN_SAND: ['#F4E3C9', '#D3A46D'],
  CANDY_LAND: ['#FFE5F5', '#FF97D8'],
  FAIRYTALE: ['#F0E8FF', '#C8A8F3'],
  PRINCESS: ['#F9E4F2', '#D8A5CF']
};

const PREMIUM_THEME_OCCASION: Partial<Record<PremiumTheme, Occasion>> = {
  ETERNAL_VOW: 'WEDDING',
  STARLIT_VOWS: 'WEDDING',
  WRITTEN_IN_SAND: 'WEDDING',
  ETERNAL_GARDEN: 'WEDDING',
  MOTHERS_DAY: 'MOTHERS_DAY',
  GRAND_CELEBRATION: 'NEW_YEARS',
  GOLDEN_HOUR: 'CONGRATULATIONS'
};

const PREMIUM_THEME_COLLECTION: Partial<Record<PremiumTheme, string>> = {
  CELESTIAL: 'Signature Premium',
  MIDNIGHT_GARDEN: 'Signature Premium',
  BOTANICAL: 'Signature Premium',
  GOLDEN_HOUR: 'Signature Premium',
  MODERN_MINIMAL: 'Signature Premium',
  PASTEL_DREAM: 'Signature Premium',
  ETERNAL_VOW: 'Signature Premium',
  GRAND_CELEBRATION: 'Signature Premium',
  VELVET_NOIR: 'Expansion',
  OCEAN_DEPTHS: 'Expansion',
  AUTUMN_EMBER: 'Expansion',
  SAKURA_REVERIE: 'Expansion',
  NORTHERN_LIGHTS: 'Expansion',
  FAIRYTALE: 'Living Art',
  PRINCESS: 'Living Art',
  SERPENTINE: 'Living Art',
  PASTA: 'Living Art',
  ORIGAMI: 'Living Art',
  WOLF_PACK: 'Living Art',
  PARIS: 'Living Art',
  LUCKY_ELEPHANT: 'Living Art',
  FLOATING_HEARTS: 'Emotion',
  MOTHERS_DAY: 'Emotion',
  BIOLUMINESCENT_OCEAN: 'Living World',
  NEBULA_GALAXY: 'Living World',
  ENCHANTED_FOREST: 'Living World',
  MONARCH_MIGRATION: 'Living World',
  VOLCANIC_EMBER: 'Living World',
  ZEN_GARDEN: 'Living World',
  ETERNAL_GARDEN: 'Wedding',
  STARLIT_VOWS: 'Wedding',
  WRITTEN_IN_SAND: 'Wedding',
  PIZZA_NIGHT: 'Food & Drink',
  OMAKASE: 'Food & Drink',
  TACO_TUESDAY: 'Food & Drink',
  COFFEE_RITUAL: 'Food & Drink',
  DONUT_SHOP: 'Food & Drink',
  BAKE_OFF: 'Food & Drink',
  ICE_CREAM_TRUCK: 'Food & Drink',
  BBQ_SMOKE: 'Food & Drink'
};

const PREMIUM_THEME_DESCRIPTION: Partial<Record<PremiumTheme, string>> = {
  WATERCOLOR: 'Scrolling multi-photo story with paint overlay, music, and finale moments.',
  CELESTIAL: 'Cosmic gradients, starfield atmosphere, and luminous constellation storytelling.',
  MIDNIGHT_GARDEN: 'Bioluminescent blooms and moonlit depth for intimate, emotional moments.',
  BOTANICAL: 'Fresh garden palette with elegant floral movement and warm organic textures.',
  GOLDEN_HOUR: 'Sunset amber glow with celebration warmth and cinematic light blooms.',
  MODERN_MINIMAL: 'Clean editorial contrast and restrained motion for polished modern messages.',
  PASTEL_DREAM: 'Soft pastel gradients, dreamy glow, and gentle romantic ambience.',
  ETERNAL_VOW: 'Wedding-forward visual language with rose-gold accents and vow-inspired tone.',
  GRAND_CELEBRATION: 'High-energy premium celebration with rich contrast and festive movement.'
};

function toKebabCase(value: string) {
  return value.toLowerCase().replace(/_/g, '-');
}

function fallbackSwatch(theme: PremiumTheme): [string, string] {
  const seed = theme
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hueA = seed % 360;
  const hueB = (seed * 3) % 360;
  return [`hsl(${hueA} 45% 18%)`, `hsl(${hueB} 55% 56%)`];
}

const PREMIUM_THEME_DEMOS: ThemeDemoItem[] = premiumThemeValues.map((theme) => {
  const premiumTheme = theme as PremiumTheme;
  return {
    id: toKebabCase(premiumTheme),
    tier: 'PREMIUM',
    premiumTheme,
    occasion: PREMIUM_THEME_OCCASION[premiumTheme] || 'JUST_BECAUSE',
    collection: PREMIUM_THEME_COLLECTION[premiumTheme] || 'Premium Collection',
    description:
      PREMIUM_THEME_DESCRIPTION[premiumTheme] || `${premiumThemeLabels[premiumTheme]} premium living story experience.`,
    swatch: PREMIUM_THEME_SWATCH[premiumTheme] || fallbackSwatch(premiumTheme)
  };
});

export const BUILT_THEME_DEMOS: ThemeDemoItem[] = [...QUICK_THEME_DEMOS, ...PREMIUM_THEME_DEMOS];

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

