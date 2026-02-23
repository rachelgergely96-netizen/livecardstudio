import Link from 'next/link';
import { CardStatus, Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/signout-button';
import { CopyLinkButton } from '@/components/dashboard/copy-link-button';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  BUILT_THEME_DEMOS,
  getThemeDemoName,
  getThemeDemoPreviewUrl,
  getThemeDemoStartUrl
} from '@/lib/themes/catalog';
import { absoluteUrl } from '@/lib/utils';
import { cardTierLabels, occasionLabels } from '@/types/card';

const filterMap: Record<string, CardStatus | undefined> = {
  all: undefined,
  drafts: CardStatus.DRAFT,
  published: CardStatus.PUBLISHED,
  archived: CardStatus.ARCHIVED
};

const sortMap: Record<string, 'asc' | 'desc'> = {
  newest: 'desc',
  oldest: 'asc',
  mostviewed: 'desc'
};

const dashboardCardInclude = {
  photos: {
    select: {
      base64Data: true,
      processedUrl: true,
      originalUrl: true
    },
    orderBy: { sortOrder: 'asc' as const },
    take: 1
  }
} satisfies Prisma.CardInclude;

type DashboardCard = Prisma.CardGetPayload<{
  include: typeof dashboardCardInclude;
}>;

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { filter?: string; sort?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const activeFilter = searchParams?.filter || 'all';
  const activeSort = searchParams?.sort || 'newest';

  let cards: DashboardCard[] = [];
  let statsCount = 0;
  let statsViews = 0;
  let sentThisMonth = 0;
  let studioDataUnavailable = false;

  try {
    cards = await prisma.card.findMany({
      where: {
        userId: session.user.id,
        status: filterMap[activeFilter]
      },
      include: dashboardCardInclude,
      orderBy:
        activeSort === 'mostviewed'
          ? { viewCount: sortMap[activeSort] }
          : {
              createdAt: sortMap[activeSort]
            }
    });

    const stats = await prisma.card.aggregate({
      _count: { id: true },
      _sum: { viewCount: true },
      where: { userId: session.user.id }
    });

    sentThisMonth = await prisma.card.count({
      where: {
        userId: session.user.id,
        publishedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    statsCount = stats._count.id;
    statsViews = stats._sum.viewCount || 0;
  } catch (error) {
    studioDataUnavailable = true;
    console.error('Failed to load dashboard data.', error);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="ui-label">Dashboard</p>
          <h1 className="section-title text-5xl">Welcome, {session.user.name || 'Creator'}</h1>
          <p className="serif-copy mt-2 text-2xl text-brand-body">Your living cards, all in one studio.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button>Create New Card</Button>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <article className="card-panel p-4">
          <p className="ui-label">Total cards</p>
          <p className="section-title mt-2 text-4xl">{statsCount}</p>
        </article>
        <article className="card-panel p-4">
          <p className="ui-label">Total views</p>
          <p className="section-title mt-2 text-4xl">{statsViews}</p>
        </article>
        <article className="card-panel p-4">
          <p className="ui-label">Cards sent this month</p>
          <p className="section-title mt-2 text-4xl">{sentThisMonth}</p>
        </article>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="ui-label">Start from a theme</p>
            <h2 className="section-title mt-1 text-3xl">Pick a style and start creating</h2>
          </div>
          <Link href="/#themes" className="text-sm text-brand-copper">
            Browse all demos
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {BUILT_THEME_DEMOS.map((theme) => {
            const name = getThemeDemoName(theme);
            return (
              <article key={theme.id} className="card-panel overflow-hidden p-4">
                <div
                  className="h-20 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})` }}
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <h3 className="section-title text-2xl">{name}</h3>
                  <span className="rounded-full border border-[rgba(200,160,120,0.28)] bg-[#fffaf3] px-2 py-1 text-xs text-brand-muted">
                    {cardTierLabels[theme.tier]}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-brand-muted">{theme.collection}</p>
                <p className="serif-copy mt-2 text-lg text-brand-body">{theme.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={getThemeDemoStartUrl(theme)}>
                    <Button className="px-3 py-2 text-xs">Start from this theme</Button>
                  </Link>
                  <Link href={getThemeDemoPreviewUrl(theme)} target="_blank">
                    <Button tone="secondary" className="px-3 py-2 text-xs">
                      Demo
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {studioDataUnavailable ? (
        <section className="mb-6 rounded-2xl border border-[rgba(200,160,120,0.28)] bg-[#fffaf3] p-4 text-sm text-brand-muted">
          Dashboard data is temporarily unavailable due to server configuration. Check database/auth environment
          variables and recent migrations.
        </section>
      ) : null}

      <section className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-sm">
          {['all', 'drafts', 'published', 'archived'].map((filter) => (
            <Link
              key={filter}
              href={`/dashboard?filter=${filter}&sort=${activeSort}`}
              className={`rounded-full border px-3 py-1.5 ${
                activeFilter === filter
                  ? 'border-brand-copper bg-brand-copper text-white'
                  : 'border-[rgba(200,160,120,0.3)] bg-[#fffaf4] text-brand-muted'
              }`}
            >
              {filter[0].toUpperCase() + filter.slice(1)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="ui-label">Sort</span>
          {[
            ['newest', 'Newest'],
            ['oldest', 'Oldest'],
            ['mostviewed', 'Most Viewed']
          ].map(([sort, label]) => (
            <Link
              key={sort}
              href={`/dashboard?filter=${activeFilter}&sort=${sort}`}
              className={`rounded-full border px-3 py-1.5 ${
                activeSort === sort
                  ? 'border-brand-copper bg-brand-copper text-white'
                  : 'border-[rgba(200,160,120,0.3)] bg-[#fffaf4] text-brand-muted'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {cards.length === 0 ? (
        <section className="card-panel flex min-h-52 flex-col items-center justify-center p-8 text-center">
          <h2 className="section-title text-4xl">Your first card is waiting to be made</h2>
          <p className="serif-copy mt-3 max-w-xl text-2xl text-brand-body">
            Create a living card in minutes and share one beautiful link.
          </p>
          <Link href="/create" className="mt-5">
            <Button>Create New Card</Button>
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const thumb = card.photos[0]?.base64Data || card.photos[0]?.processedUrl || card.photos[0]?.originalUrl || '';
            const shareUrl = absoluteUrl(`/c/${card.slug}`);
            return (
              <article key={card.id} className="card-panel overflow-hidden transition hover:-translate-y-1">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={`${card.recipientName} thumbnail`} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-[linear-gradient(135deg,#f3debf,#ead8f4)]" />
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="section-title text-3xl leading-tight">{card.recipientName}</h3>
                    <span className="rounded-full border border-[rgba(200,160,120,0.3)] px-2 py-1 text-xs uppercase tracking-[0.08em] text-brand-muted">
                      {card.status}
                    </span>
                  </div>
                  <p className="serif-copy text-xl text-brand-body">{occasionLabels[card.occasion]}</p>
                  <p className="text-sm text-brand-muted">Created {card.createdAt.toLocaleDateString()}</p>
                  <p className="text-sm text-brand-muted">Views {card.viewCount}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/create?cardId=${card.id}`}>
                      <Button tone="secondary" className="px-3 py-2 text-xs">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/c/${card.slug}`} target="_blank">
                      <Button tone="secondary" className="px-3 py-2 text-xs">
                        Preview
                      </Button>
                    </Link>
                    <CopyLinkButton url={shareUrl} />
                    <Link href={`/card/${card.slug}/share`}>
                      <Button tone="secondary" className="px-3 py-2 text-xs">
                        Share
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
