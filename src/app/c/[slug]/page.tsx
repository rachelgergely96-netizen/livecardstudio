import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { demoCardHtml } from '@/lib/cards/demo-html';
import { toCardGenerationInput } from '@/lib/cards/build-card-input';
import { generateCardHtml } from '@/lib/cards/html-generator';
import { prisma } from '@/lib/db/prisma';
import { readStorageContent } from '@/lib/integrations/storage-read';
import { absoluteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getCard(slug: string) {
  return prisma.card.findUnique({
    where: { slug },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' }
      },
      giftCard: true,
      user: {
        select: { name: true }
      }
    }
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (params.slug === 'demo') {
    return {
      title: 'LiveCardStudio Demo',
      description: 'A living card crafted with love - tap to experience it.',
      openGraph: {
        title: 'LiveCardStudio Demo',
        description: 'A living card crafted with love - tap to experience it.',
        siteName: 'LiveCardStudio',
        url: absoluteUrl('/c/demo'),
        type: 'website',
        images: [{ url: absoluteUrl('/og/demo.png'), width: 1200, height: 630 }]
      },
      twitter: {
        card: 'summary_large_image',
        title: 'LiveCardStudio Demo',
        description: 'A living card crafted with love - tap to experience it.',
        images: [absoluteUrl('/og/demo.png')]
      }
    };
  }

  const card = await prisma.card.findUnique({
    where: { slug: params.slug },
    select: {
      recipientName: true,
      ogImageUrl: true,
      slug: true
    }
  });

  if (!card) {
    return {
      title: 'Card not found'
    };
  }

  const title = `Someone made you something beautiful, ${card.recipientName}`;
  const description = 'A living card crafted with love - tap to experience it.';
  const image = card.ogImageUrl || absoluteUrl(`/og/${card.slug}.png`);
  const url = absoluteUrl(`/c/${card.slug}`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'LiveCardStudio',
      images: [{ url: image, width: 1200, height: 630 }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

export default async function PublicCardPage({ params }: { params: { slug: string } }) {
  if (params.slug === 'demo') {
    return (
      <main className="min-h-screen bg-[#fdf8f0]">
        <iframe
          title="LiveCardStudio demo"
          srcDoc={demoCardHtml}
          className="h-screen w-full border-none"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="autoplay"
        />
      </main>
    );
  }

  const card = await getCard(params.slug);
  if (!card) {
    notFound();
  }

  await prisma.card.update({
    where: { id: card.id },
    data: {
      viewCount: { increment: 1 },
      firstViewedAt: card.firstViewedAt || new Date()
    }
  });

  let html = '';

  if (card.htmlUrl) {
    try {
      html = await readStorageContent(card.htmlUrl);
    } catch (error) {
      console.error('Failed to load stored card HTML, regenerating fallback', error);
    }
  }

  if (!html) {
    const input = toCardGenerationInput(card);
    input.senderName = card.user?.name || 'With love';
    html = generateCardHtml(input);
  }

  return (
    <main className="min-h-screen bg-[#fdf8f0]">
      <iframe
        title={`Card for ${card.recipientName}`}
        srcDoc={html}
        className="h-screen w-full border-none"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="autoplay"
      />
    </main>
  );
}
