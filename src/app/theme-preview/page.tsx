import Link from 'next/link';
import { CardTier } from '@prisma/client';
import { generateCardHtml } from '@/lib/cards/html-generator';
import { buildCreateThemeUrl, parseCreateThemePreset } from '@/lib/themes/presets';
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

function buildPhotoPlaceholder(label: string, a: string, b: string) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="${escapeXml(
    label
  )}">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${a}" />
        <stop offset="100%" stop-color="${b}" />
      </linearGradient>
      <radialGradient id="r" cx="0.25" cy="0.2" r="0.8">
        <stop offset="0%" stop-color="rgba(255,255,255,0.45)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
    <rect width="1200" height="1500" fill="url(#g)" />
    <rect width="1200" height="1500" fill="url(#r)" />
    <text x="600" y="760" text-anchor="middle" font-family="Georgia, serif" font-size="86" fill="rgba(255,255,255,0.88)">
      ${escapeXml(label)}
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default function ThemePreviewPage({
  searchParams
}: {
  searchParams?: {
    tier?: string;
    quickTheme?: string;
    premiumTheme?: string;
    occasion?: string;
  };
}) {
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

  const photos =
    tier === CardTier.QUICK
      ? [
          {
            src: buildPhotoPlaceholder(`${themeLabel} Demo`, '#d4a574', '#c4b0d4')
          }
        ]
      : [
          { src: buildPhotoPlaceholder(`${themeLabel} Story`, '#e8d7c2', '#c5a6be') },
          { src: buildPhotoPlaceholder('Memory One', '#c5a6be', '#b4ccd8') },
          { src: buildPhotoPlaceholder('Memory Two', '#b4ccd8', '#e9c89f') },
          { src: buildPhotoPlaceholder('Finale', '#e9c89f', '#d4a574') }
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

  return (
    <main className="min-h-screen bg-[#fdf8f0]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="ui-label">{tier === CardTier.QUICK ? 'Quick Theme Demo' : 'Premium Theme Demo'}</p>
          <h1 className="section-title mt-1 text-3xl">{themeLabel}</h1>
          <p className="text-sm text-brand-muted">Occasion: {occasionLabels[occasion]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={startUrl}
            className="rounded-full border border-[rgba(200,160,120,0.28)] bg-brand-copper px-4 py-2 text-sm text-white"
          >
            Start From This Theme
          </Link>
          <Link
            href="/#themes"
            className="rounded-full border border-[rgba(200,160,120,0.28)] bg-[#fffaf4] px-4 py-2 text-sm text-brand-muted"
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

