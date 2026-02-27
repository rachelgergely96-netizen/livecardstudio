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

export const PREMIUM_THEME_SWATCH: Partial<Record<PremiumTheme, [string, string]>> = {
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
  PRINCESS: ['#F9E4F2', '#D8A5CF'],
  EDITORIAL: ['#F5F5F0', '#2A2A35'],
  GOOD_BOY: ['#F5EDE2', '#C4935A'],
  MIDNIGHT_WHISKERS: ['#0E0E1C', '#9B8FBF'],
  MONARCH_MIGRATION: ['#1C1408', '#E89F35'],
  MOTHERS_DAY: ['#FFF0F5', '#D4789C'],
  FLOATING_HEARTS: ['#1A0A18', '#E87CA0'],
  SERPENTINE: ['#0A1418', '#58C8A0'],
  PASTA: ['#FFF6E8', '#D4883C'],
  ORIGAMI: ['#F7F0E8', '#D45B5B'],
  WOLF_PACK: ['#101418', '#8CA0B8'],
  PARIS: ['#F2EDE8', '#C89878'],
  LUCKY_ELEPHANT: ['#1A0E22', '#D4A83C'],
  PIZZA_NIGHT: ['#2A1208', '#E85830'],
  OMAKASE: ['#0A0E14', '#E8C8A0'],
  TACO_TUESDAY: ['#2A1808', '#E8B830'],
  COFFEE_RITUAL: ['#1A1008', '#C89460'],
  DONUT_SHOP: ['#FFF0E8', '#E87CA0'],
  BAKE_OFF: ['#2A1A0E', '#E8A848'],
  ICE_CREAM_TRUCK: ['#E8F4FF', '#FF8EC8'],
  BBQ_SMOKE: ['#1A1210', '#D47830']
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
  WATERCOLOR: 'Signature Premium',
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
  NEON_TOKYO: 'Expansion',
  EDITORIAL: 'Expansion',
  FAIRYTALE: 'Living Art',
  PRINCESS: 'Living Art',
  SERPENTINE: 'Living Art',
  PASTA: 'Living Art',
  ORIGAMI: 'Living Art',
  WOLF_PACK: 'Living Art',
  PARIS: 'Living Art',
  LUCKY_ELEPHANT: 'Living Art',
  CANDY_LAND: 'Living Art',
  GOOD_BOY: 'Emotion',
  MIDNIGHT_WHISKERS: 'Emotion',
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
  GRAND_CELEBRATION: 'High-energy premium celebration with rich contrast and festive movement.',
  VELVET_NOIR: 'Rich plum velvet and shadow with moody, intimate nightclub atmosphere.',
  OCEAN_DEPTHS: 'Deep blue immersion with bioluminescent glow and slow underwater drift.',
  AUTUMN_EMBER: 'Warm amber leaves, rustic glow, and cozy fireside storytelling.',
  SAKURA_REVERIE: 'Soft cherry blossom pink with petal drift and springtime reverie.',
  NORTHERN_LIGHTS: 'Aurora greens and cosmic teal with polar night wonder.',
  NEON_TOKYO: 'Electric cyan neon, rain-slicked streets, and cyberpunk energy.',
  EDITORIAL: 'Clean lines, bold typography, and magazine-cover sophistication.',
  BIOLUMINESCENT_OCEAN: 'Glowing deep-sea creatures and luminous teal ocean currents.',
  NEBULA_GALAXY: 'Swirling purple nebula, distant stars, and infinite galactic scale.',
  ENCHANTED_FOREST: 'Mossy greens, magical light shafts, and ancient woodland mystery.',
  VOLCANIC_EMBER: 'Molten lava glow, ember particles, and raw elemental power.',
  ZEN_GARDEN: 'Raked sand, moss stones, and meditative calm in muted greens.',
  ETERNAL_GARDEN: 'Lush garden blooms and vine trails for everlasting wedding vows.',
  STARLIT_VOWS: 'Lavender starlight and celestial romance for evening weddings.',
  WRITTEN_IN_SAND: 'Golden sand, ocean breeze, and handwritten vows at sunset.',
  FLOATING_HEARTS: 'Drifting hearts, warm blush tones, and pure romantic energy.',
  MOTHERS_DAY: 'Soft florals and gentle warmth crafted for mothers everywhere.',
  FAIRYTALE: 'Dreamy pastels, castle spires, and storybook enchantment.',
  PRINCESS: 'Pink sparkle, crown motifs, and magical princess charm.',
  SERPENTINE: 'Sinuous scales, jewel tones, and mythical serpent elegance.',
  PASTA: 'Hand-rolled charm, Italian warmth, and carb-fueled celebration.',
  ORIGAMI: 'Crisp paper folds, geometric beauty, and mindful precision.',
  WOLF_PACK: 'Moonlit howl, pack loyalty, and wild forest spirit.',
  PARIS: 'Eiffel Tower lights, cafe warmth, and French romantic allure.',
  LUCKY_ELEPHANT: 'Jeweled elephant motifs, vibrant celebration, and good fortune.',
  CANDY_LAND: 'Bubblegum swirls, pastel frosting, and sugary wonderland.',
  GOOD_BOY: 'Playful paws, wagging tails, and loyal companion love.',
  MIDNIGHT_WHISKERS: 'Moonlit cats, whisker silhouettes, and cozy night mystery.',
  MONARCH_MIGRATION: 'Orange butterfly wings in flight across vast open skies.',
  PIZZA_NIGHT: 'Melted cheese, red pepper flakes, and Friday night joy.',
  OMAKASE: 'Minimalist plating, sushi precision, and chef\'s choice elegance.',
  TACO_TUESDAY: 'Bright salsas, lime zest, and festive taqueria vibes.',
  COFFEE_RITUAL: 'Steaming latte art, espresso warmth, and morning ritual calm.',
  DONUT_SHOP: 'Sprinkled frosting, pastel glazes, and sweet indulgence.',
  BAKE_OFF: 'Rolling pins, golden crusts, and homemade baking warmth.',
  ICE_CREAM_TRUCK: 'Summer melodies, rainbow scoops, and childhood nostalgia.',
  BBQ_SMOKE: 'Charcoal smoke, grill marks, and backyard gathering warmth.'
};

function toKebabCase(value: string) {
  return value.toLowerCase().replace(/_/g, '-');
}

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hPrime = h / 60;
  const x = chroma * (1 - Math.abs((hPrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hPrime >= 0 && hPrime < 1) {
    r = chroma;
    g = x;
  } else if (hPrime >= 1 && hPrime < 2) {
    r = x;
    g = chroma;
  } else if (hPrime >= 2 && hPrime < 3) {
    g = chroma;
    b = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    g = x;
    b = chroma;
  } else if (hPrime >= 4 && hPrime < 5) {
    r = x;
    b = chroma;
  } else if (hPrime >= 5 && hPrime < 6) {
    r = chroma;
    b = x;
  }

  const match = lightness - chroma / 2;
  const rr = Math.round((r + match) * 255);
  const gg = Math.round((g + match) * 255);
  const bb = Math.round((b + match) * 255);

  return `#${[rr, gg, bb].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function fallbackSwatch(theme: PremiumTheme): [string, string] {
  const seed = theme
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hueA = seed % 360;
  const hueB = (seed * 3) % 360;
  return [hslToHex(hueA, 45, 18), hslToHex(hueB, 55, 56)];
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

/** Unique collections in display order for gallery filtering */
export const THEME_COLLECTIONS: string[] = [
  'Atmospheric',
  'Signature Premium',
  'Expansion',
  'Wedding',
  'Living Art',
  'Living World',
  'Emotion',
  'Food & Drink'
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

export function getThemeDemoEmbedPreviewUrl(item: ThemeDemoItem) {
  const base = getThemeDemoPreviewUrl(item);
  const [path, query] = base.split('?');
  const params = new URLSearchParams(query || '');
  params.set('embed', '1');
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

/** Look up the [bg, accent] swatch for a theme by its enum key. */
export function getThemeSwatch(
  quickTheme?: QuickTheme | string,
  premiumTheme?: PremiumTheme | string
): [string, string] | undefined {
  if (premiumTheme) {
    return PREMIUM_THEME_SWATCH[premiumTheme as PremiumTheme] ?? fallbackSwatch(premiumTheme as PremiumTheme);
  }
  if (quickTheme) {
    const item = QUICK_THEME_DEMOS.find((d) => d.quickTheme === quickTheme);
    return item?.swatch;
  }
  return undefined;
}
