import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Eye, PenLine, Send } from 'lucide-react';

dayjs.extend(relativeTime);

type ActivityCard = {
  id: string;
  slug: string;
  recipientName: string;
  createdAt: Date;
  publishedAt: Date | null;
  firstViewedAt: Date | null;
};

type ActivityItem = {
  key: string;
  label: string;
  href: string;
  time: Date;
  icon: typeof PenLine;
};

function getLatestByDate<T extends ActivityCard>(items: T[], key: 'createdAt' | 'publishedAt' | 'firstViewedAt') {
  return [...items].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    return (right?.getTime() || 0) - (left?.getTime() || 0);
  })[0];
}

export function RecentActivity({ cards }: { cards: ActivityCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  const newestCreated = getLatestByDate(cards, 'createdAt');
  const newestPublished = getLatestByDate(cards.filter((card) => card.publishedAt), 'publishedAt');
  const newestViewed = getLatestByDate(cards.filter((card) => card.firstViewedAt), 'firstViewedAt');

  const activity: ActivityItem[] = [];
  if (newestCreated) {
    activity.push({
      key: `created-${newestCreated.id}`,
      label: `Created card for ${newestCreated.recipientName}`,
      href: `/create?cardId=${newestCreated.id}`,
      time: newestCreated.createdAt,
      icon: PenLine
    });
  }
  if (newestPublished?.publishedAt) {
    activity.push({
      key: `published-${newestPublished.id}`,
      label: `Published card for ${newestPublished.recipientName}`,
      href: `/c/${newestPublished.slug}`,
      time: newestPublished.publishedAt,
      icon: Send
    });
  }
  if (newestViewed?.firstViewedAt) {
    activity.push({
      key: `viewed-${newestViewed.id}`,
      label: `${newestViewed.recipientName} opened their card`,
      href: `/card/${newestViewed.slug}/share`,
      time: newestViewed.firstViewedAt,
      icon: Eye
    });
  }

  if (activity.length === 0) {
    return null;
  }

  return (
    <section className="card-panel p-5">
      <p className="ui-label">Recent activity</p>
      <h2 className="section-title text-2xl">What happened lately</h2>
      <ul className="mt-3 space-y-2">
        {activity.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3 py-2 transition hover:bg-[var(--color-surface-hover)]"
              >
                <span className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                    <Icon className="h-4 w-4 text-brand-copper" />
                  </span>
                  {item.label}
                </span>
                <span className="text-xs text-brand-muted">{dayjs(item.time).fromNow()}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

