import { CardTier, Occasion, PremiumTheme, QuickTheme } from '@prisma/client';
import { cardTierValues, occasionValues, premiumThemeValues, quickThemeValues } from '@/types/card';

type MaybeString = string | string[] | null | undefined;

type ParseThemeParams = {
  tier?: MaybeString;
  quickTheme?: MaybeString;
  premiumTheme?: MaybeString;
  occasion?: MaybeString;
};

export type CreateThemePreset = {
  tier?: CardTier;
  quickTheme?: QuickTheme;
  premiumTheme?: PremiumTheme;
  occasion?: Occasion;
};

function firstValue(value: MaybeString) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || undefined;
}

function parseEnumValue<T extends readonly string[]>(allowed: T, value?: string) {
  if (!value) {
    return undefined;
  }
  return allowed.includes(value) ? (value as T[number]) : undefined;
}

export function parseCreateThemePreset(searchParams?: ParseThemeParams): CreateThemePreset {
  const explicitTier = parseEnumValue(cardTierValues, firstValue(searchParams?.tier)) as CardTier | undefined;
  const quickTheme = parseEnumValue(quickThemeValues, firstValue(searchParams?.quickTheme)) as QuickTheme | undefined;
  const premiumTheme = parseEnumValue(premiumThemeValues, firstValue(searchParams?.premiumTheme)) as
    | PremiumTheme
    | undefined;
  const occasion = parseEnumValue(occasionValues, firstValue(searchParams?.occasion)) as Occasion | undefined;

  let tier = explicitTier;
  if (!tier) {
    if (quickTheme && !premiumTheme) {
      tier = 'QUICK';
    } else if (premiumTheme && !quickTheme) {
      tier = 'PREMIUM';
    }
  }

  const preset: CreateThemePreset = {};
  if (tier) {
    preset.tier = tier;
  }
  if (occasion) {
    preset.occasion = occasion;
  }

  if (tier === 'QUICK' && quickTheme) {
    preset.quickTheme = quickTheme;
  }
  if (tier === 'PREMIUM' && premiumTheme) {
    preset.premiumTheme = premiumTheme;
  }

  return preset;
}

export function toCreateThemeSearchParams(
  preset: CreateThemePreset,
  options?: {
    cardId?: string | null | undefined;
  }
) {
  const params = new URLSearchParams();

  if (options?.cardId) {
    params.set('cardId', options.cardId);
  }
  if (preset.tier) {
    params.set('tier', preset.tier);
  }
  if (preset.occasion) {
    params.set('occasion', preset.occasion);
  }
  if (preset.tier === 'QUICK' && preset.quickTheme) {
    params.set('quickTheme', preset.quickTheme);
  }
  if (preset.tier === 'PREMIUM' && preset.premiumTheme) {
    params.set('premiumTheme', preset.premiumTheme);
  }

  return params.toString();
}

export function buildCreateThemeUrl(
  preset: CreateThemePreset,
  options?: {
    cardId?: string | null | undefined;
  }
) {
  const query = toCreateThemeSearchParams(preset, options);
  return query ? `/create?${query}` : '/create';
}

export function buildThemePreviewUrl(preset: CreateThemePreset) {
  const query = toCreateThemeSearchParams(preset);
  return query ? `/theme-preview?${query}` : '/theme-preview';
}

