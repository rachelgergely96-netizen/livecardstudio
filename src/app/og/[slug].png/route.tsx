import { ImageResponse } from 'next/og';
import { occasionLabels, resolveThemeLabel } from '@/types/card';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const themeBackgrounds: Record<string, { from: string; to: string; accent: string; dark?: boolean }> = {
  AURORA_DREAMS: { from: '#0A0E1A', to: '#1A1E2E', accent: '#78C8B4', dark: true },
  DEEP_BIOLUMINESCENCE: { from: '#04081A', to: '#0E1530', accent: '#50B4DC', dark: true },
  FIREFLY_MEADOW: { from: '#1A1E2E', to: '#2A2E3E', accent: '#C8D88C', dark: true },
  LANTERN_FESTIVAL: { from: '#1A1420', to: '#2E2228', accent: '#E8B464', dark: true },
  MIDNIGHT_RAIN: { from: '#181B22', to: '#2A2D38', accent: '#7B9CB8', dark: true },
  SAKURA_WIND: { from: '#F5F0E8', to: '#EDE5D8', accent: '#D4919B' },
  FIRST_DANCE: { from: '#0F172A', to: '#1A2236', accent: '#D8B36B', dark: true },
  CHAMPAGNE_TOAST: { from: '#20140D', to: '#37261A', accent: '#F0C06E', dark: true },
  RINGS_OF_LIGHT: { from: '#100E1D', to: '#241F3B', accent: '#D3AF66', dark: true },
  WATERCOLOR: { from: '#fdf8f0', to: '#f1e3cf', accent: '#c87941' },
  CELESTIAL: { from: '#141427', to: '#2d3152', accent: '#d4a574', dark: true },
  MIDNIGHT_GARDEN: { from: '#11111f', to: '#2a2f40', accent: '#9ecb77', dark: true },
  BOTANICAL: { from: '#eef6eb', to: '#d7e8d2', accent: '#66875f' },
  GOLDEN_HOUR: { from: '#fff4de', to: '#efcc8a', accent: '#d08a32' },
  MODERN_MINIMAL: { from: '#f8f7f5', to: '#eae4dd', accent: '#b8865d' },
  PASTEL_DREAM: { from: '#fdf1f6', to: '#eaf2fb', accent: '#b082b8' },
  ETERNAL_VOW: { from: '#141120', to: '#3c305b', accent: '#d8b674', dark: true },
  GRAND_CELEBRATION: { from: '#26120f', to: '#552b1e', accent: '#f2be69', dark: true }
};

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const slug = context?.params?.slug || 'demo';
  const isDemo = slug === 'demo';

  let recipientName = 'Someone special';
  let occasionLabel = 'A living card made with love';
  let paletteKey = 'WATERCOLOR';
  let themeLabel = 'Watercolor';

  if (!isDemo) {
    const card = await prisma.card.findUnique({
      where: { slug },
      select: {
        recipientName: true,
        occasion: true,
        tier: true,
        quickTheme: true,
        premiumTheme: true
      }
    });

    if (card) {
      recipientName = card.recipientName;
      occasionLabel = occasionLabels[card.occasion] || occasionLabel;
      paletteKey = card.tier === 'QUICK' ? card.quickTheme || 'AURORA_DREAMS' : card.premiumTheme || 'WATERCOLOR';
      themeLabel = resolveThemeLabel({
        tier: card.tier,
        quickTheme: card.quickTheme,
        premiumTheme: card.premiumTheme
      });
    }
  }

  const palette = themeBackgrounds[paletteKey] || themeBackgrounds.WATERCOLOR;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '58px 70px',
          background: `linear-gradient(140deg, ${palette.from}, ${palette.to})`,
          color: palette.dark ? '#f6f1ff' : '#3a2f2a',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 12% 18%, rgba(255,255,255,.42), transparent 38%), radial-gradient(circle at 82% 70%, rgba(255,255,255,.2), transparent 40%)'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <span style={{ fontSize: 30, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>
            LiveCardStudio
          </span>
          <h1 style={{ fontSize: 92, lineHeight: 1, fontStyle: 'italic', margin: '20px 0 14px', color: palette.accent }}>
            {recipientName}
          </h1>
          <p style={{ fontSize: 40, margin: 0 }}>{occasionLabel}</p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            fontSize: 28
          }}
        >
          <span>A living card made with love</span>
          <span style={{ opacity: 0.8 }}>{themeLabel}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
