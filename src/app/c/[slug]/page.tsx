import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTracker } from '@/components/card/view-tracker';
import { demoCardHtml } from '@/lib/cards/demo-html';
import { toCardGenerationInput } from '@/lib/cards/build-card-input';
import { generateCardHtml } from '@/lib/cards/html-generator';
import { prisma } from '@/lib/db/prisma';
import { readStorageContent } from '@/lib/integrations/storage-read';
import { absoluteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function CreateYourOwnCta() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-solid)] px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="ui-label">Inspired by this card?</p>
          <h2 className="section-title mt-2 text-3xl">Create your own living card</h2>
          <p className="mt-2 text-sm text-brand-muted">
            Start with photos, add a message, pick a theme, and share one beautiful link.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={{
              pathname: '/signup',
              query: { callbackUrl: '/create' }
            }}
            className="rounded-full bg-brand-copper px-4 py-2 text-sm text-white"
          >
            Start Free
          </Link>
          <Link
            href={{
              pathname: '/login',
              query: { callbackUrl: '/create' }
            }}
            className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-4 py-2 text-sm text-brand-muted"
          >
            Log In
          </Link>
        </div>
      </div>
    </section>
  );
}

async function getCard(slug: string) {
  return prisma.card.findUnique({
    where: { slug },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' }
      },
      giftCard: true,
      user: {
        select: { name: true, email: true }
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
      <main className="min-h-screen bg-[var(--color-midnight)]">
        <iframe
          title="LiveCardStudio demo"
          srcDoc={demoCardHtml}
          className="h-screen w-full border-none"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="autoplay"
        />
        <CreateYourOwnCta />
      </main>
    );
  }

  const card = await getCard(params.slug);
  if (!card) {
    notFound();
  }

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
    <main className="min-h-screen bg-[var(--color-midnight)]">
      <ViewTracker slug={card.slug} />
      <iframe
        title={`Card for ${card.recipientName}`}
        srcDoc={html}
        className="h-screen w-full border-none"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="autoplay"
      />
      <CreateYourOwnCta />
    </main>
  );
}
