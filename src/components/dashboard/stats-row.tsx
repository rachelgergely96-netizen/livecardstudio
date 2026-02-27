import { Eye, Layers, Send, TrendingUp } from 'lucide-react';

type StatsRowProps = {
  totalCards: number;
  totalViews: number;
  publishedThisMonth: number;
  topCardViews: number;
};

const statItems = [
  {
    key: 'totalCards',
    label: 'Total Cards',
    icon: Layers
  },
  {
    key: 'totalViews',
    label: 'Total Views',
    icon: Eye
  },
  {
    key: 'publishedThisMonth',
    label: 'Published This Month',
    icon: Send
  },
  {
    key: 'topCardViews',
    label: 'Top Card Views',
    icon: TrendingUp
  }
] as const;

export function StatsRow({ totalCards, totalViews, publishedThisMonth, topCardViews }: StatsRowProps) {
  const valueMap = {
    totalCards,
    totalViews,
    publishedThisMonth,
    topCardViews
  };

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = valueMap[item.key];
        return (
          <article key={item.key} className="card-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="ui-label">{item.label}</p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)]">
                <Icon className="h-4 w-4 text-brand-muted" />
              </span>
            </div>
            <p className="section-title mt-2 text-3xl">{value.toLocaleString()}</p>
          </article>
        );
      })}
    </section>
  );
}

