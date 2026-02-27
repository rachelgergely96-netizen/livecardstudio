import Link from 'next/link';
import { CardTier } from '@prisma/client';
import { generateCardHtml } from '@/lib/cards/html-generator';
import { auth } from '@/lib/auth/session';
import { buildCreateThemeUrl, parseCreateThemePreset } from '@/lib/themes/presets';
import { getThemeSwatch } from '@/lib/themes/catalog';
import {
  getDefaultPremiumTheme,
  getDefaultQuickTheme,
  occasionLabels,
  premiumThemeLabels,
  quickThemeLabels
} from '@/types/card';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}

function mixColors(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function lighten(hex: string, amount: number): string {
  return mixColors(hex, '#ffffff', amount);
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function buildPhotoPlaceholder(label: string, a: string, b: string, idx: number) {
  const gradId = `g${idx}`;
  const radId = `r${idx}`;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="${escapeXml(
    label
  )}">
    <defs>
      <linearGradient id="${gradId}" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${a}" />
        <stop offset="100%" stop-color="${b}" />
      </linearGradient>
      <radialGradient id="${radId}" cx="0.25" cy="0.2" r="0.8">
        <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
    <rect width="1200" height="1500" fill="url(#${gradId})" />
    <rect width="1200" height="1500" fill="url(#${radId})" />
    <text x="600" y="760" text-anchor="middle" font-family="Georgia, serif" font-size="86" fill="rgba(255,255,255,0.88)">
      ${escapeXml(label)}
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function ThemePreviewPage({
  searchParams
}: {
  searchParams?: {
    tier?: string;
    quickTheme?: string;
    premiumTheme?: string;
    occasion?: string;
    embed?: string;
  };
}) {
  const embed = searchParams?.embed === '1';
  const session = embed ? null : await auth();
  const preset = parseCreateThemePreset(searchParams);
  const tier = preset.tier || CardTier.QUICK;
  const occasion = preset.occasion || 'BIRTHDAY';
  const quickTheme = tier === CardTier.QUICK ? preset.quickTheme || getDefaultQuickTheme(occasion) : undefined;
  const premiumTheme = tier === CardTier.PREMIUM ? preset.premiumTheme || getDefaultPremiumTheme(occasion) : undefined;

  const themeLabel =
    tier === CardTier.QUICK && quickTheme
      ? quickThemeLabels[quickTheme]
      : premiumTheme
      ? premiumThemeLabels[premiumTheme]
      : 'Theme';

  const swatch = getThemeSwatch(quickTheme, premiumTheme);
  const rawBg = swatch?.[0] || '#1a1020';
  const rawAccent = swatch?.[1] || '#d4a574';
  const bg = isHexColor(rawBg) ? rawBg : '#1a1020';
  const accent = isHexColor(rawAccent) ? rawAccent : '#d4a574';
  const tintLight = lighten(accent, 0.35);
  const tintMid = mixColors(bg, accent, 0.45);
  const tintWarm = mixColors(accent, bg, 0.3);

  const photos =
    tier === CardTier.QUICK
      ? [
          {
            src: buildPhotoPlaceholder(`${themeLabel} Demo`, accent, tintLight, 0)
          }
        ]
      : [
          { src: buildPhotoPlaceholder(`${themeLabel} Story`, accent, tintLight, 0) },
          { src: buildPhotoPlaceholder('Memory One', tintLight, tintMid, 1) },
          { src: buildPhotoPlaceholder('Memory Two', tintMid, tintWarm, 2) },
          { src: buildPhotoPlaceholder('Finale', tintWarm, accent, 3) }
        ];

  const html = generateCardHtml({
    slug: `theme-preview-${tier.toLowerCase()}-${themeLabel.toLowerCase().replaceAll(' ', '-')}`,
    recipientName: 'Your Recipient',
    senderName: 'From you',
    title: `${themeLabel} Demo`,
    occasion,
    tier,
    quickTheme,
    premiumTheme,
    message:
      tier === CardTier.QUICK
        ? `This is a live ${themeLabel} demo.\nTap the photo to cycle filters and explore the mood.`
        : `This is a live ${themeLabel} demo.\nScroll through the experience and preview premium story interactions.`,
    musicStyle: tier === CardTier.QUICK ? 'NONE' : 'MUSIC_BOX_BIRTHDAY',
    photos,
    sectionMessages: tier === CardTier.PREMIUM ? ['First scene', 'Middle scene', 'Final scene'] : undefined
  });

  const startUrl = buildCreateThemeUrl({
    tier,
    occasion,
    quickTheme,
    premiumTheme
  });
  const backToThemesUrl = session?.user?.id ? '/dashboard#theme-gallery' : '/#themes';

  if (embed) {
    return (
      <main className="h-screen w-screen bg-black">
        <iframe
          title={`${themeLabel} embedded theme preview`}
          srcDoc={html}
          className="h-full w-full border-none"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="autoplay"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="ui-label">{tier === CardTier.QUICK ? 'Quick Theme Demo' : 'Premium Theme Demo'}</p>
          <h1 className="section-title mt-1 text-2xl md:text-3xl">{themeLabel}</h1>
          <p className="text-sm text-brand-muted">Occasion: {occasionLabels[occasion]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={startUrl}
            className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-dark-midnight"
          >
            Start From This Theme
          </Link>
          <Link
            href={backToThemesUrl}
            className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-4 py-2 text-sm text-brand-muted"
          >
            Back to Themes
          </Link>
        </div>
      </header>
      <iframe
        title={`${themeLabel} theme preview`}
        srcDoc={html}
        className="h-[calc(100vh-92px)] w-full border-none"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="autoplay"
      />
    </main>
  );
}
