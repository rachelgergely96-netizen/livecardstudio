'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardStatus } from '@prisma/client';
import { ExternalLink, Eye, PenLine, Search, Share2 } from 'lucide-react';
import { CopyLinkButton } from '@/components/dashboard/copy-link-button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import type { DashboardCardSerializable } from '@/components/dashboard/types';
import { Button } from '@/components/ui/button';
import { absoluteUrl, cn } from '@/lib/utils';
import { occasionLabels } from '@/types/card';

dayjs.extend(relativeTime);

const FILTER_VALUES = ['all', 'drafts', 'published', 'archived'] as const;
const SORT_VALUES = ['newest', 'oldest', 'mostviewed'] as const;

type FilterKey = (typeof FILTER_VALUES)[number];
type SortKey = (typeof SORT_VALUES)[number];

function parseFilter(value: string | null): FilterKey {
  if (value && FILTER_VALUES.includes(value as FilterKey)) {
    return value as FilterKey;
  }
  return 'all';
}

function parseSort(value: string | null): SortKey {
  if (value && SORT_VALUES.includes(value as SortKey)) {
    return value as SortKey;
  }
  return 'newest';
}

function matchesFilter(status: CardStatus, filter: FilterKey) {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'drafts') {
    return status === 'DRAFT' || status === 'PREVIEW';
  }
  if (filter === 'published') {
    return status === 'PAID' || status === 'PUBLISHED';
  }
  return status === 'ARCHIVED';
}

function getEmptyMessage(filter: FilterKey, query: string) {
  if (query.trim()) {
    return 'No cards match your search.';
  }
  if (filter === 'drafts') {
    return 'No draft cards yet.';
  }
  if (filter === 'published') {
    return 'No published cards yet.';
  }
  if (filter === 'archived') {
    return 'No archived cards yet.';
  }
  return 'Your first card is waiting to be made.';
}

export function CardListSection({ cards }: { cards: DashboardCardSerializable[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [filter, setFilter] = useState<FilterKey>(() => parseFilter(searchParams.get('filter')));
  const [sort, setSort] = useState<SortKey>(() => parseSort(searchParams.get('sort')));
  const [query, setQuery] = useState(() => searchParams.get('q') || '');

  useEffect(() => {
    setFilter(parseFilter(searchParams.get('filter')));
    setSort(parseSort(searchParams.get('sort')));
    setQuery(searchParams.get('q') || '');
  }, [searchParams, searchParamsKey]);

  const syncUrl = useCallback(
    (nextFilter: FilterKey, nextSort: SortKey, nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextFilter === 'all') {
        params.delete('filter');
      } else {
        params.set('filter', nextFilter);
      }

      if (nextSort === 'newest') {
        params.delete('sort');
      } else {
        params.set('sort', nextSort);
      }

      const trimmedQuery = nextQuery.trim();
      if (trimmedQuery) {
        params.set('q', trimmedQuery);
      } else {
        params.delete('q');
      }

      const queryString = params.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const visibleCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = cards.filter((card) => {
      const matchesName = normalizedQuery ? card.recipientName.toLowerCase().includes(normalizedQuery) : true;
      return matchesName && matchesFilter(card.status, filter);
    });

    return filtered.sort((left, right) => {
      if (sort === 'mostviewed') {
        if (right.viewCount !== left.viewCount) {
          return right.viewCount - left.viewCount;
        }
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      const diff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      return sort === 'newest' ? diff : -diff;
    });
  }, [cards, filter, query, sort]);

  const actionClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] text-brand-muted transition hover:bg-[var(--color-surface-hover)] hover:text-brand-charcoal';

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ui-label">Your cards</p>
          <h2 className="section-title text-3xl">Manage and ship your cards</h2>
        </div>
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              syncUrl(filter, sort, nextQuery);
            }}
            placeholder="Search by recipient name"
            className="w-full rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-9 py-2 text-sm text-brand-charcoal placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-copper/20"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-sm">
          {FILTER_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilter(value);
                syncUrl(value, sort, query);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 transition',
                filter === value
                  ? 'border-brand-copper bg-brand-copper text-white'
                  : 'border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] text-brand-muted hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="ui-label">Sort</span>
          <select
            value={sort}
            onChange={(event) => {
              const nextSort = parseSort(event.target.value);
              setSort(nextSort);
              syncUrl(filter, nextSort, query);
            }}
            className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-3 py-1.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-copper/20"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="mostviewed">Most Viewed</option>
          </select>
        </div>
      </div>

      {visibleCards.length === 0 ? (
        <section className="card-panel flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <h3 className="section-title text-3xl">{getEmptyMessage(filter, query)}</h3>
          <p className="serif-copy mt-2 max-w-xl text-xl text-brand-body">
            Create a living card in minutes and share one beautiful link.
          </p>
          <Link href="/create" className="mt-4">
            <Button>Create New Card</Button>
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => {
            const thumbnail =
              card.photos[0]?.base64Data || card.photos[0]?.processedUrl || card.photos[0]?.originalUrl || '';

            return (
              <article key={card.id} className="card-panel overflow-hidden">
                <div className="relative">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnail} alt={`${card.recipientName} thumbnail`} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-[linear-gradient(135deg,var(--color-deep-plum),#1a1030)]" />
                  )}
                  <StatusBadge status={card.status} className="absolute right-2 top-2 bg-[var(--color-surface-solid)]" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="space-y-1">
                    <h3 className="section-title text-3xl leading-tight">{card.recipientName}</h3>
                    <p className="text-sm text-brand-muted">{occasionLabels[card.occasion]}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-muted">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {card.viewCount}
                    </span>
                    <span>Created {dayjs(card.createdAt).fromNow()}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/create?cardId=${card.id}`} className={actionClass} title="Edit card" aria-label="Edit card">
                      <PenLine className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/c/${card.slug}`}
                      target="_blank"
                      className={actionClass}
                      title="Preview card"
                      aria-label="Preview card"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <CopyLinkButton
                      url={absoluteUrl(`/c/${card.slug}`)}
                      iconOnly
                      className={actionClass}
                      label="Copy share link"
                    />
                    <Link
                      href={`/card/${card.slug}/share`}
                      className={actionClass}
                      title="Share options"
                      aria-label="Share options"
                    >
                      <Share2 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

