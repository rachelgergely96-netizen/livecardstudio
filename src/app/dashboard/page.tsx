import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { CardListSection } from '@/components/dashboard/card-list-section';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatsRow } from '@/components/dashboard/stats-row';
import { ThemeGallery } from '@/components/dashboard/theme-gallery';
import { serializeCards, type DashboardCardRecord } from '@/components/dashboard/types';
import { WelcomeBar } from '@/components/dashboard/welcome-bar';
import { auth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

const dashboardCardSelect = {
  id: true,
  slug: true,
  recipientName: true,
  occasion: true,
  tier: true,
  status: true,
  viewCount: true,
  createdAt: true,
  publishedAt: true,
  firstViewedAt: true,
  photos: {
    select: {
      base64Data: true,
      processedUrl: true,
      originalUrl: true
    },
    orderBy: { sortOrder: 'asc' as const },
    take: 1
  }
} satisfies Prisma.CardSelect;

type DashboardCard = Prisma.CardGetPayload<{
  select: typeof dashboardCardSelect;
}>;

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function toDisplayName(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    return name;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Creator';
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const monthStart = getMonthStart();
  let cards: DashboardCard[] = [];
  let totalCards = 0;
  let totalViews = 0;
  let sentThisMonth = 0;
  let userPlan = session.user.plan;
  let userName = session.user.name || null;
  let studioDataUnavailable = false;

  try {
    const [cardRows, stats, sentCount, userRecord] = await Promise.all([
      prisma.card.findMany({
        where: {
          userId: session.user.id
        },
        select: dashboardCardSelect,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.card.aggregate({
        _count: { id: true },
        _sum: { viewCount: true },
        where: { userId: session.user.id }
      }),
      prisma.card.count({
        where: {
          userId: session.user.id,
          publishedAt: {
            gte: monthStart
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          plan: true
        }
      })
    ]);

    cards = cardRows;
    totalCards = stats._count.id;
    totalViews = stats._sum.viewCount || 0;
    sentThisMonth = sentCount;
    userPlan = userRecord?.plan || userPlan;
    userName = userRecord?.name || userName;
  } catch (error) {
    studioDataUnavailable = true;
    console.error('Failed to load dashboard data.', error);
  }

  const isNewUser = cards.length === 0;
  const topPerformer = cards.reduce<DashboardCardRecord | null>((best, card) => {
    if (!best || card.viewCount > best.viewCount) {
      return card;
    }
    return best;
  }, null);

  const displayName = toDisplayName(userName, session.user.email);

  return (
    <DashboardShell userName={displayName} userPlan={userPlan}>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <WelcomeBar name={displayName} totalCards={totalCards} />

        <StatsRow
          totalCards={totalCards}
          totalViews={totalViews}
          publishedThisMonth={sentThisMonth}
          topCardViews={topPerformer?.viewCount || 0}
        />

        {isNewUser ? (
          <OnboardingBanner />
        ) : (
          <RecentActivity cards={cards.map((card) => ({ ...card }))} />
        )}

        {studioDataUnavailable ? (
          <section className="rounded-2xl border border-[rgba(200,160,120,0.28)] bg-[#fffaf3] p-4 text-sm text-brand-muted">
            Dashboard data is temporarily unavailable due to server configuration. Check database/auth environment
            variables and recent migrations.
          </section>
        ) : null}

        <CardListSection cards={serializeCards(cards)} />

        <ThemeGallery />
      </div>
    </DashboardShell>
  );
}
