import { CardTier, MusicStyle, Occasion, PremiumTheme, QuickTheme } from '@prisma/client';
import {
  occasionValues,
  premiumThemeLabels,
  premiumThemeValues,
  quickThemeLabels,
  quickThemeValues
} from '@/types/card';

type MaybeString = string | string[] | null | undefined;

type IntegrationSearchParams = {
  recipientName?: MaybeString;
  recipient_name?: MaybeString;
  occasion?: MaybeString;
  message?: MaybeString;
  backgroundMusic?: MaybeString;
  background_music?: MaybeString;
  giftCardSelection?: MaybeString;
  gift_card_selection?: MaybeString;
  themeSelection?: MaybeString;
  theme_selection?: MaybeString;
  theme?: MaybeString;
};

type SeedGift = {
  brand: string;
  amount: number;
  currency: string;
};

type ParsedThemeSelection = {
  tier?: CardTier;
  quickTheme?: QuickTheme;
  premiumTheme?: PremiumTheme;
};

export type ECardIntegrationSeed = {
  recipientName?: string;
  occasion?: Occasion;
  message?: string;
  tier?: CardTier;
  quickTheme?: QuickTheme;
  premiumTheme?: PremiumTheme;
  musicStyle?: MusicStyle;
  customAudio?: {
    url: string;
    name: string;
  };
  giftCard?: SeedGift | null;
};

function firstValue(value: MaybeString) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || undefined;
}

function normalize(value: string | undefined) {
  return (value || '').trim();
}

function normalizeKey(value: string | undefined) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const occasionAliasMap: Record<string, Occasion> = {
  birthday: 'BIRTHDAY',
  wedding: 'WEDDING',
  engagement: 'ENGAGEMENT',
  anniversary: 'ANNIVERSARY',
  'baby shower': 'BABY_SHOWER',
  babyshower: 'BABY_SHOWER',
  graduation: 'GRADUATION',
  valentine: 'VALENTINES',
  valentines: 'VALENTINES',
  "valentine's": 'VALENTINES',
  'mothers day': 'MOTHERS_DAY',
  "mother's day": 'MOTHERS_DAY',
  'fathers day': 'FATHERS_DAY',
  "father's day": 'FATHERS_DAY',
  holiday: 'HOLIDAY',
  'new year': 'NEW_YEARS',
  "new year's": 'NEW_YEARS',
  'thank you': 'THANK_YOU',
  'just because': 'JUST_BECAUSE',
  sympathy: 'SYMPATHY',
  congratulations: 'CONGRATULATIONS',
  promotion: 'PROMOTION'
};

function parseOccasion(value: string | undefined): Occasion | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;

  const directEnum = raw.toUpperCase();
  if (occasionValues.includes(directEnum as Occasion)) {
    return directEnum as Occasion;
  }

  const alias = occasionAliasMap[normalizeKey(raw)];
  return alias || undefined;
}

const quickThemeNameMap = Object.entries(quickThemeLabels).reduce<Record<string, QuickTheme>>((acc, [key, label]) => {
  acc[normalizeKey(label)] = key as QuickTheme;
  return acc;
}, {});

const premiumThemeNameMap = Object.entries(premiumThemeLabels).reduce<Record<string, PremiumTheme>>((acc, [key, label]) => {
  acc[normalizeKey(label)] = key as PremiumTheme;
  return acc;
}, {});

function parseThemeSelection(value: string | undefined): ParsedThemeSelection {
  const raw = normalize(value);
  if (!raw) {
    return {};
  }

  const enumKey = raw.toUpperCase().replace(/\s+/g, '_');
  if (quickThemeValues.includes(enumKey as QuickTheme)) {
    return { tier: 'QUICK' as CardTier, quickTheme: enumKey as QuickTheme };
  }
  if (premiumThemeValues.includes(enumKey as PremiumTheme)) {
    return { tier: 'PREMIUM' as CardTier, premiumTheme: enumKey as PremiumTheme };
  }

  const normalized = normalizeKey(raw);

  const integrationThemeIdMap: Record<string, { tier: CardTier; quickTheme?: QuickTheme; premiumTheme?: PremiumTheme }> = {
    '22c4223a-0f58-4962-ae92-46dc8ab16d0e': {
      tier: 'QUICK',
      quickTheme: 'LANTERN_FESTIVAL'
    }
  };
  if (integrationThemeIdMap[raw]) {
    return integrationThemeIdMap[raw];
  }

  if (quickThemeNameMap[normalized]) {
    return { tier: 'QUICK' as CardTier, quickTheme: quickThemeNameMap[normalized] };
  }
  if (premiumThemeNameMap[normalized]) {
    return { tier: 'PREMIUM' as CardTier, premiumTheme: premiumThemeNameMap[normalized] };
  }

  if (normalized.includes('festive') || normalized.includes('celebration')) {
    return { tier: 'QUICK' as CardTier, quickTheme: 'CHAMPAGNE_TOAST' as QuickTheme };
  }
  if (normalized.includes('elegant') || normalized.includes('classic')) {
    return { tier: 'QUICK' as CardTier, quickTheme: 'SAKURA_WIND' as QuickTheme };
  }
  if (normalized.includes('playful') || normalized.includes('fun')) {
    return { tier: 'QUICK' as CardTier, quickTheme: 'FIREFLY_MEADOW' as QuickTheme };
  }
  if (normalized.includes('modern') || normalized.includes('minimal')) {
    return { tier: 'QUICK' as CardTier, quickTheme: 'MIDNIGHT_RAIN' as QuickTheme };
  }
  if (normalized.includes('romance') || normalized.includes('wedding')) {
    return { tier: 'QUICK' as CardTier, quickTheme: 'FIRST_DANCE' as QuickTheme };
  }

  return {};
}

function looksLikeAudioUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^\/api\/storage\//i.test(value) || /^storage:\/\//i.test(value);
}

function mapMusicStyle(value: string | undefined): MusicStyle | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;

  const enumKey = raw.toUpperCase().replace(/\s+/g, '_');
  const validStyles: MusicStyle[] = [
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
  ];
  if (validStyles.includes(enumKey as MusicStyle)) {
    return enumKey as MusicStyle;
  }

  const normalized = normalizeKey(raw);
  if (normalized.includes('none') || normalized.includes('silent') || normalized.includes('no music')) {
    return 'NONE';
  }
  if (normalized.includes('piano')) {
    return 'GENTLE_PIANO';
  }
  if (normalized.includes('harp')) {
    return 'ROMANTIC_HARP';
  }
  if (normalized.includes('guitar')) {
    return 'SOFT_GUITAR';
  }
  if (normalized.includes('chime')) {
    return 'WIND_CHIMES';
  }
  if (normalized.includes('orchestral') || normalized.includes('festive')) {
    return 'FESTIVE_ORCHESTRAL';
  }
  if (normalized.includes('ambient')) {
    return 'AMBIENT_WARM';
  }
  if (normalized.includes('celestial')) {
    return 'CELESTIAL_PADS';
  }
  if (normalized.includes('waltz')) {
    return 'WALTZ_MUSIC_BOX';
  }
  if (normalized.includes('birthday') || normalized.includes('music box')) {
    return 'MUSIC_BOX_BIRTHDAY';
  }

  return undefined;
}

function parseGiftCard(value: string | undefined): SeedGift | null | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;

  const normalized = normalizeKey(raw);
  if (normalized === 'none' || normalized === 'no gift' || normalized === 'no gift card') {
    return null;
  }

  const amountMatch = raw.match(/\$?\s*(\d{1,4})(?:\.\d{1,2})?/);
  const amount = amountMatch ? Math.round(Number(amountMatch[1]) * 100) : 2500;
  const brand = raw.replace(/\$?\s*\d{1,4}(?:\.\d{1,2})?/, '').replace(/[-:]/g, ' ').trim() || 'Amazon';

  return {
    brand,
    amount,
    currency: 'USD'
  };
}

export function parseECardIntegrationSeed(searchParams?: IntegrationSearchParams): ECardIntegrationSeed {
  const recipientName = normalize(firstValue(searchParams?.recipientName) || firstValue(searchParams?.recipient_name));
  const occasionValue = firstValue(searchParams?.occasion);
  const message = normalize(firstValue(searchParams?.message));
  const backgroundMusic =
    normalize(firstValue(searchParams?.backgroundMusic) || firstValue(searchParams?.background_music));
  const giftSelection =
    normalize(firstValue(searchParams?.giftCardSelection) || firstValue(searchParams?.gift_card_selection));
  const themeSelection = normalize(firstValue(searchParams?.themeSelection) || firstValue(searchParams?.theme_selection));
  const themeId = normalize(firstValue(searchParams?.theme));

  const theme = parseThemeSelection(themeSelection || themeId);
  const musicStyle = mapMusicStyle(backgroundMusic);
  const giftCard = parseGiftCard(giftSelection);

  const customAudio =
    backgroundMusic && looksLikeAudioUrl(backgroundMusic)
      ? {
          url: backgroundMusic,
          name: 'Imported Audio'
        }
      : undefined;

  return {
    recipientName: recipientName || undefined,
    occasion: parseOccasion(occasionValue),
    message: message || undefined,
    tier: theme.tier,
    quickTheme: theme.quickTheme,
    premiumTheme: theme.premiumTheme,
    musicStyle,
    customAudio,
    giftCard
  };
}
