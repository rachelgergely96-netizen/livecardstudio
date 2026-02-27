'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BUILT_THEME_DEMOS,
  THEME_COLLECTIONS,
  getThemeDemoEmbedPreviewUrl,
  getThemeDemoName,
  getThemeDemoPreviewUrl,
  getThemeDemoStartUrl
} from '@/lib/themes/catalog';
import { cardTierLabels } from '@/types/card';

const INITIAL_VISIBLE = 12;

export function ThemeGallery() {
  const [collection, setCollection] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = collection
    ? BUILT_THEME_DEMOS.filter((t) => t.collection === collection)
    : BUILT_THEME_DEMOS;

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  return (
    <div>
      {/* Filter tabs */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center">
        <button
          type="button"
          onClick={() => { setCollection(null); setShowAll(false); }}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            collection === null
              ? 'bg-dark-gold text-dark-midnight'
              : 'border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:border-dark-gold/40 hover:text-dark-cream'
          }`}
        >
          All ({BUILT_THEME_DEMOS.length})
        </button>
        {THEME_COLLECTIONS.map((col) => {
          const count = BUILT_THEME_DEMOS.filter((t) => t.collection === col).length;
          return (
            <button
              key={col}
              type="button"
              onClick={() => { setCollection(col); setShowAll(false); }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                collection === col
                  ? 'bg-dark-gold text-dark-midnight'
                  : 'border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:border-dark-gold/40 hover:text-dark-cream'
              }`}
            >
              {col} ({count})
            </button>
          );
        })}
      </div>

      {/* Theme grid */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((theme) => {
          const name = getThemeDemoName(theme);
          const previewUrl = getThemeDemoPreviewUrl(theme);
          const embedPreviewUrl = getThemeDemoEmbedPreviewUrl(theme);
          const startUrl = getThemeDemoStartUrl(theme);

          return (
            <article
              key={theme.id}
              className="card-panel overflow-hidden p-4 transition hover:border-dark-gold/30"
            >
              <div className="relative h-36 overflow-hidden rounded-xl border border-[var(--color-border-medium)] md:h-28">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`
                  }}
                />
                <iframe
                  title={`${name} preview`}
                  src={embedPreviewUrl}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-none"
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
                  allow="autoplay"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/20" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <h4 className="font-display text-xl font-bold">{name}</h4>
                <span className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
                  {cardTierLabels[theme.tier]}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {theme.collection}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-body)]">{theme.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="rounded-full border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold text-[var(--color-text-body)] transition hover:border-dark-gold/40"
                >
                  View Demo
                </Link>
                <Link
                  href={startUrl}
                  className="rounded-full bg-gold-gradient px-3 py-2 text-xs font-semibold text-dark-midnight"
                >
                  Start From This Theme
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Show more toggle */}
      {hasMore && !showAll && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full border border-[var(--color-border-strong)] px-6 py-3 text-sm font-semibold text-[var(--color-text-body)] transition hover:border-dark-gold/40 hover:text-dark-cream"
          >
            Show All {filtered.length} Themes
          </button>
        </div>
      )}
    </div>
  );
}
