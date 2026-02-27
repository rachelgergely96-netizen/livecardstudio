import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BUILT_THEME_DEMOS,
  getThemeDemoName,
  getThemeDemoPreviewUrl,
  getThemeDemoStartUrl
} from '@/lib/themes/catalog';
import { cardTierLabels } from '@/types/card';

export function ThemeGallery() {
  return (
    <section id="theme-gallery" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="ui-label">Start from a theme</p>
          <h2 className="section-title text-3xl">Pick a style and start creating</h2>
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
                style={{
                  background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <h3 className="section-title text-2xl">{name}</h3>
                <span className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-2 py-1 text-xs text-brand-muted">
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
  );
}

