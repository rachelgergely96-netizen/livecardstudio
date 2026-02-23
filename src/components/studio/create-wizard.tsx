'use client';

import { CardStatus, MusicStyle, Occasion, Theme } from '@prisma/client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoManager, type PhotoItem } from '@/components/studio/photo-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatUsd } from '@/lib/utils';
import { defaultCardFeatures, occasionLabels, themeLabels } from '@/types/card';

type GiftCardInput = {
  brand: string;
  tremendousProductId?: string;
  amount: number;
  currency: string;
};

type WizardCard = {
  id?: string;
  slug?: string;
  title: string;
  recipientName: string;
  occasion: Occasion;
  theme: Theme;
  message: string;
  sectionMessages: string[];
  musicStyle: MusicStyle;
  featureToggles: {
    photoInteractions: boolean;
    brushReveal: boolean;
    paintCanvas: boolean;
    confettiFinale: boolean;
  };
  status?: CardStatus;
  photos: PhotoItem[];
  giftCard: GiftCardInput | null;
};

type GiftBrand = {
  id: string;
  name: string;
  image_url?: string;
};

const steps = [
  'Choose Your Moment',
  'Add Photos',
  'Write Message',
  'Choose Style',
  'Add a Gift',
  'Preview & Checkout'
];

const musicOptions: MusicStyle[] = [
  'MUSIC_BOX_BIRTHDAY',
  'AMBIENT_WARM',
  'GENTLE_PIANO',
  'CELESTIAL_PADS',
  'SOFT_GUITAR',
  'NONE'
];

function normalizeCard(input?: Partial<WizardCard>): WizardCard {
  return {
    id: input?.id,
    slug: input?.slug,
    title: input?.title || "My Living Card",
    recipientName: input?.recipientName || '',
    occasion: input?.occasion || 'BIRTHDAY',
    theme: input?.theme || 'WATERCOLOR',
    message: input?.message || '',
    sectionMessages: input?.sectionMessages || [],
    musicStyle: input?.musicStyle || 'MUSIC_BOX_BIRTHDAY',
    featureToggles: {
      ...defaultCardFeatures,
      ...(input?.featureToggles || {})
    },
    status: input?.status || 'DRAFT',
    photos: input?.photos || [],
    giftCard: input?.giftCard || null
  };
}

export function CreateWizard({
  initialCard,
  userPlan
}: {
  initialCard?: Partial<WizardCard>;
  userPlan: 'FREE' | 'PREMIUM' | 'PRO';
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [card, setCard] = useState<WizardCard>(() => normalizeCard(initialCard));
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [giftBrands, setGiftBrands] = useState<GiftBrand[]>([]);
  const [previewUrl, setPreviewUrl] = useState(card.slug ? `/c/${card.slug}` : '');

  const cardCostCents = userPlan === 'PRO' ? 0 : 1900;
  const giftCostCents = card.giftCard?.amount || 0;

  const totalCents = cardCostCents + giftCostCents;

  async function ensureCardExists() {
    if (card.id) return card.id;

    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: card.title,
        recipientName: card.recipientName || 'Someone Special',
        occasion: card.occasion,
        theme: card.theme,
        message: card.message || 'A note from the heart',
        sectionMessages: card.sectionMessages,
        musicStyle: card.musicStyle,
        featureToggles: card.featureToggles,
        giftCard: card.giftCard
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Could not create draft card.');
    }

    setCard((current) => ({
      ...current,
      id: payload.card.id,
      slug: payload.card.slug,
      status: payload.card.status
    }));

    router.replace(`/create?cardId=${payload.card.id}`);
    return payload.card.id as string;
  }

  async function saveDraft() {
    try {
      setSaving(true);
      setStatus('');

      const cardId = await ensureCardExists();
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: card.title,
          recipientName: card.recipientName,
          occasion: card.occasion,
          theme: card.theme,
          message: card.message,
          sectionMessages: card.sectionMessages,
          musicStyle: card.musicStyle,
          featureToggles: card.featureToggles,
          giftCard: card.giftCard
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save card draft.');
      }

      setCard((current) => ({
        ...current,
        status: payload.card.status
      }));
      setStatus('Draft saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save draft.');
    } finally {
      setSaving(false);
    }
  }

  async function loadGiftBrands() {
    if (giftBrands.length) return;

    try {
      const response = await fetch('/api/gifts/brands', { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok) {
        setGiftBrands(payload.brands || []);
      }
    } catch {
      // Non-fatal in wizard.
    }
  }

  async function generatePreview() {
    try {
      setSaving(true);
      setStatus('');
      await saveDraft();
      const cardId = await ensureCardExists();

      const response = await fetch(`/api/cards/${cardId}/generate`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not generate preview.');
      }

      setPreviewUrl(`/c/${payload.card.slug}`);
      setCard((current) => ({ ...current, slug: payload.card.slug }));
      setStatus('Preview is ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not generate preview.');
    } finally {
      setSaving(false);
    }
  }

  async function completeCheckout() {
    try {
      setSaving(true);
      setStatus('');
      await saveDraft();
      const cardId = await ensureCardExists();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not start checkout.');
      }

      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      if (card.slug) {
        router.push(`/card/${card.slug}/share`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Checkout failed.');
      setSaving(false);
    }
  }

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(card.recipientName.trim() && card.title.trim());
    }
    if (step === 1) {
      return card.photos.length > 0;
    }
    if (step === 2) {
      return Boolean(card.message.trim());
    }
    return true;
  }, [step, card]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="card-panel p-6">
        <header>
          <p className="ui-label">Step {step + 1} of {steps.length}</p>
          <h1 className="section-title mt-2 text-4xl">{steps[step]}</h1>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(200,160,120,0.18)]">
            <i
              className="block h-full rounded-full bg-[linear-gradient(90deg,#c87941,#d4a574)] transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-brand-muted">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`rounded-full border px-2.5 py-1 ${
                  index === step
                    ? 'border-brand-copper bg-brand-copper text-white'
                    : 'border-[rgba(200,160,120,0.3)] bg-[#fffaf3]'
                }`}
                onClick={() => setStep(index)}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </header>

        {step === 0 ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="ui-label">Occasion</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(occasionLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCard((current) => ({ ...current, occasion: value as Occasion }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      card.occasion === value
                        ? 'border-brand-copper bg-brand-copper/10 text-brand-charcoal'
                        : 'border-[rgba(200,160,120,0.28)] bg-white/70 text-brand-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ui-label">Who is this card for?</label>
              <Input
                value={card.recipientName}
                onChange={(event) => setCard((current) => ({ ...current, recipientName: event.target.value }))}
                placeholder="Maya"
              />
            </div>

            <div>
              <label className="ui-label">Card title (internal)</label>
              <Input
                value={card.title}
                onChange={(event) => setCard((current) => ({ ...current, title: event.target.value }))}
                placeholder="Maya's Birthday"
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <PhotoManager
              photos={card.photos}
              onPhotosChange={(photos) => setCard((current) => ({ ...current, photos }))}
              cardId={card.id}
              ensureCardExists={ensureCardExists}
              userPlan={userPlan}
              onStatus={setStatus}
              onBusyChange={setSaving}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="ui-label">Main message</label>
              <Textarea
                value={card.message}
                onChange={(event) => setCard((current) => ({ ...current, message: event.target.value }))}
                className="min-h-40 font-body text-lg"
                placeholder={`Write from the heart. What do you want ${card.recipientName || 'them'} to feel?`}
              />
              <p className="mt-1 text-xs text-brand-muted">{card.message.length} characters</p>
            </div>

            <div>
              <label className="ui-label">Section messages (optional)</label>
              {[0, 1, 2].map((index) => (
                <Input
                  key={index}
                  className="mt-2"
                  value={card.sectionMessages[index] || ''}
                  onChange={(event) => {
                    const next = [...card.sectionMessages];
                    next[index] = event.target.value;
                    setCard((current) => ({ ...current, sectionMessages: next }));
                  }}
                  placeholder={`Section ${index + 1} message`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="ui-label">Theme</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(themeLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCard((current) => ({ ...current, theme: value as Theme }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      card.theme === value
                        ? 'border-brand-copper bg-brand-copper/10 text-brand-charcoal'
                        : 'border-[rgba(200,160,120,0.28)] bg-white/70 text-brand-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ui-label">Music</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {musicOptions.map((musicStyle) => (
                  <button
                    key={musicStyle}
                    type="button"
                    onClick={() => setCard((current) => ({ ...current, musicStyle }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      card.musicStyle === musicStyle
                        ? 'border-brand-copper bg-brand-copper/10 text-brand-charcoal'
                        : 'border-[rgba(200,160,120,0.28)] bg-white/70 text-brand-muted'
                    }`}
                  >
                    {musicStyle.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ui-label">Interactive features</label>
              <div className="mt-2 space-y-2">
                {Object.entries(card.featureToggles).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-[rgba(200,160,120,0.28)] bg-white/70 px-3 py-2"
                  >
                    <span className="text-sm text-brand-charcoal">{key}</span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(event) =>
                        setCard((current) => ({
                          ...current,
                          featureToggles: {
                            ...current.featureToggles,
                            [key]: event.target.checked
                          }
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[rgba(200,160,120,0.28)] bg-white/70 p-3">
              <label className="flex items-center justify-between">
                <span className="ui-label">Include gift card</span>
                <input
                  type="checkbox"
                  checked={Boolean(card.giftCard)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setCard((current) => ({
                        ...current,
                        giftCard: current.giftCard || {
                          brand: 'Amazon',
                          amount: 2500,
                          currency: 'USD'
                        }
                      }));
                      void loadGiftBrands();
                    } else {
                      setCard((current) => ({ ...current, giftCard: null }));
                    }
                  }}
                />
              </label>

              {card.giftCard ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="ui-label">Brand</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-[rgba(200,160,120,0.28)] bg-white px-3 py-2"
                      value={card.giftCard.tremendousProductId || ''}
                      onChange={(event) => {
                        const selected = giftBrands.find((brand) => brand.id === event.target.value);
                        setCard((current) => ({
                          ...current,
                          giftCard: current.giftCard
                            ? {
                                ...current.giftCard,
                                brand: selected?.name || current.giftCard.brand,
                                tremendousProductId: event.target.value || undefined
                              }
                            : null
                        }));
                      }}
                    >
                      <option value="">Select a brand</option>
                      {giftBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="ui-label">Amount (USD)</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {[1000, 2500, 5000, 7500, 10000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-sm ${
                            card.giftCard?.amount === amount
                              ? 'border-brand-copper bg-brand-copper text-white'
                              : 'border-[rgba(200,160,120,0.28)] bg-white/70 text-brand-muted'
                          }`}
                          onClick={() =>
                            setCard((current) => ({
                              ...current,
                              giftCard: current.giftCard ? { ...current.giftCard, amount } : null
                            }))
                          }
                        >
                          {formatUsd(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[rgba(200,160,120,0.28)] bg-white/70 p-4">
              <p className="ui-label">Order summary</p>
              <ul className="mt-2 space-y-1.5 text-sm text-brand-body">
                <li>Card type: {occasionLabels[card.occasion]} for {card.recipientName || 'Recipient'}</li>
                <li>Theme: {themeLabels[card.theme]}</li>
                <li>Photos: {card.photos.length}</li>
                <li>Music: {card.musicStyle.replaceAll('_', ' ')}</li>
                <li>Features: {Object.entries(card.featureToggles).filter(([, enabled]) => enabled).length} enabled</li>
                {card.giftCard ? <li>Gift card: {card.giftCard.brand} {formatUsd(card.giftCard.amount)}</li> : null}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button tone="secondary" type="button" onClick={generatePreview} disabled={saving}>
                Generate Preview
              </Button>
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button tone="secondary" type="button">Open Full Preview</Button>
                </a>
              ) : null}
              <Button type="button" onClick={completeCheckout} disabled={saving}>
                Complete & Send
              </Button>
            </div>
          </div>
        ) : null}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(200,160,120,0.2)] pt-4">
          <div className="flex gap-2">
            <Button tone="secondary" type="button" onClick={() => setStep((value) => Math.max(0, value - 1))}>
              Back
            </Button>
            <Button tone="secondary" type="button" onClick={saveDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
            disabled={!canContinue}
          >
            Next
          </Button>
        </footer>

        {status ? <p className="mt-3 text-sm text-brand-copper">{status}</p> : null}
      </section>

      <aside className="card-panel h-fit p-5 lg:sticky lg:top-6">
        <p className="ui-label">Live summary</p>
        <h2 className="section-title mt-2 text-3xl">{card.title || 'Untitled card'}</h2>
        <p className="serif-copy mt-1 text-xl text-brand-body">For {card.recipientName || 'Recipient'}</p>

        <dl className="mt-4 space-y-2 text-sm text-brand-muted">
          <div className="flex justify-between gap-3"><dt>Occasion</dt><dd>{occasionLabels[card.occasion]}</dd></div>
          <div className="flex justify-between gap-3"><dt>Theme</dt><dd>{themeLabels[card.theme]}</dd></div>
          <div className="flex justify-between gap-3"><dt>Photos</dt><dd>{card.photos.length}</dd></div>
          <div className="flex justify-between gap-3"><dt>Status</dt><dd>{card.status || 'DRAFT'}</dd></div>
          <div className="flex justify-between gap-3"><dt>Music</dt><dd>{card.musicStyle.replaceAll('_', ' ')}</dd></div>
        </dl>

        <div className="mt-5 border-t border-[rgba(200,160,120,0.2)] pt-4 text-sm text-brand-body">
          <div className="flex justify-between"><span>Premium card</span><span>{formatUsd(cardCostCents)}</span></div>
          <div className="mt-1 flex justify-between"><span>Gift card</span><span>{formatUsd(giftCostCents)}</span></div>
          <div className="mt-2 flex justify-between text-base font-semibold text-brand-charcoal">
            <span>Total</span>
            <span>{formatUsd(totalCents)}</span>
          </div>
        </div>

        {previewUrl ? (
          <div className="mt-5 rounded-xl border border-[rgba(200,160,120,0.26)] bg-white/70 p-3">
            <p className="ui-label">Preview</p>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-brand-copper">
              Open recipient view
            </a>
            {card.slug ? (
              <a href={`/card/${card.slug}/share`} className="mt-1 block text-sm text-brand-copper">
                Open share page
              </a>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
