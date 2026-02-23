import { ImageResponse } from 'next/og';
import { occasionLabels, themeLabels } from '@/types/card';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const themeBackgrounds: Record<string, { from: string; to: string; accent: string }> = {
  WATERCOLOR: { from: '#fdf8f0', to: '#f1e3cf', accent: '#c87941' },
  CELESTIAL: { from: '#141427', to: '#2d3152', accent: '#d4a574' },
  MODERN_MINIMAL: { from: '#f8f7f5', to: '#eae4dd', accent: '#b8865d' },
  BOTANICAL: { from: '#eef6eb', to: '#d7e8d2', accent: '#66875f' },
  VINTAGE_FILM: { from: '#f4eee3', to: '#d9c4a8', accent: '#a26b49' },
  GOLDEN_HOUR: { from: '#fff4de', to: '#efcc8a', accent: '#d08a32' },
  MIDNIGHT_GARDEN: { from: '#11111f', to: '#2a2f40', accent: '#9ecb77' },
  PASTEL_DREAM: { from: '#fdf1f6', to: '#eaf2fb', accent: '#b082b8' }
};

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const slug = context?.params?.slug || 'demo';
  const isDemo = slug === 'demo';

  let recipientName = 'Someone special';
  let occasionLabel = 'A living card made with love';
  let theme = 'WATERCOLOR';

  if (!isDemo) {
    const card = await prisma.card.findUnique({
      where: { slug },
      select: {
        recipientName: true,
        occasion: true,
        theme: true
      }
    });

    if (card) {
      recipientName = card.recipientName;
      occasionLabel = occasionLabels[card.occasion] || occasionLabel;
      theme = card.theme;
    }
  }

  const palette = themeBackgrounds[theme] || themeBackgrounds.WATERCOLOR;

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
          color: theme === 'CELESTIAL' || theme === 'MIDNIGHT_GARDEN' ? '#f6f1ff' : '#3a2f2a',
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
          <span style={{ opacity: 0.8 }}>{themeLabels[theme as keyof typeof themeLabels] || 'Watercolor'}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
