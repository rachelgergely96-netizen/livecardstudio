'use client';

import { CardStatus, MusicStyle, Occasion, CardTier, QuickTheme, PremiumTheme } from '@prisma/client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AudioManager, type AudioTrack } from '@/components/studio/audio-manager';
import { PhotoManager, type PhotoItem } from '@/components/studio/photo-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatUsd } from '@/lib/utils';
import { BUILT_THEME_DEMOS, getThemeDemoName, getThemeDemoPreviewUrl } from '@/lib/themes/catalog';
import {
  cardTierLabels,
  defaultCardFeatures,
  getDefaultPremiumTheme,
  getDefaultQuickTheme,
  getOccasionRecommendations,
  occasionLabels,
  premiumThemeLabels,
  quickThemeLabels,
  resolveThemeLabel
} from '@/types/card';

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
  tier: CardTier;
  quickTheme: QuickTheme;
  premiumTheme: PremiumTheme;
  message: string;
  sectionMessages: string[];
  musicStyle: MusicStyle;
  customAudio: AudioTrack | null;
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
  'Card Details',
  'Select Photos',
  'Optional Audio',
  'Choose Theme',
  'Add a Gift Inside',
  'Preview & Checkout'
];

const musicOptions: MusicStyle[] = [
  'MUSIC_BOX_BIRTHDAY',
  'AMBIENT_WARM',
  'GENTLE_PIANO',
  'CELESTIAL_PADS',
  'SOFT_GUITAR',
  'WALTZ_MUSIC_BOX',
  'FESTIVE_ORCHESTRAL',
  'ROMANTIC_HARP',
  'WIND_CHIMES',
  'NONE'
];

type UpgradeFeature = 'premium_theme' | 'photos' | 'gift_card';

const UPGRADE_PROMPTS: Record<UpgradeFeature, { title: string; message: string }> = {
  premium_theme: {
    title: 'Premium themes are a paid feature',
    message: 'Upgrade to Premium or Pro to unlock premium theme styles and advanced storytelling layouts.'
  },
  photos: {
    title: 'Need more than 4 photos?',
    message: 'Free plans include up to 4 photos. Upgrade to Premium or Pro to add up to 12 photos per card.'
  },
  gift_card: {
    title: 'Gift cards require an upgrade',
    message: 'Unlock e-gift card reveals with a Premium or Pro plan.'
  }
};

function normalizeCard(input?: Partial<WizardCard>): WizardCard {
  const occasion = input?.occasion || 'BIRTHDAY';
  const tier = input?.tier || 'QUICK';

  return {
    id: input?.id,
    slug: input?.slug,
    title: input?.title || 'My Living Card',
    recipientName: input?.recipientName || '',
    occasion,
    tier,
    quickTheme: input?.quickTheme || getDefaultQuickTheme(occasion),
    premiumTheme: input?.premiumTheme || getDefaultPremiumTheme(occasion),
    message: input?.message || '',
    sectionMessages: input?.sectionMessages || [],
    musicStyle: input?.musicStyle || (tier === 'QUICK' ? 'NONE' : 'MUSIC_BOX_BIRTHDAY'),
    customAudio: input?.customAudio || null,
    featureToggles: {
      ...defaultCardFeatures,
      ...(input?.featureToggles || {})
    },
    status: input?.status || 'DRAFT',
    photos: input?.photos || [],
    giftCard: input?.giftCard || null
  };
}

function toMusicLabel(style: MusicStyle) {
  return style.replaceAll('_', ' ');
}

function themeSelected(theme: (typeof BUILT_THEME_DEMOS)[number], card: WizardCard) {
  if (theme.tier !== card.tier) {
    return false;
  }
  if (theme.tier === 'QUICK') {
    return Boolean(theme.quickTheme && card.quickTheme === theme.quickTheme);
  }
  return Boolean(theme.premiumTheme && card.premiumTheme === theme.premiumTheme);
}

function audioSummary(card: WizardCard) {
  if (card.customAudio?.name) {
    return `Uploaded track: ${card.customAudio.name}`;
  }
  return `Soundtrack style: ${toMusicLabel(card.musicStyle)}`;
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
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradeFeature | null>(null);

  const recommendations = getOccasionRecommendations(card.occasion);
  const selectedThemeLabel = resolveThemeLabel({
    tier: card.tier,
    quickTheme: card.quickTheme,
    premiumTheme: card.premiumTheme
  });

  const cardCostCents =
    userPlan === 'PRO'
      ? 0
      : card.tier === 'QUICK'
      ? userPlan === 'FREE'
        ? 0
        : 500
      : 1900;

  const giftCostCents = card.giftCard?.amount || 0;
  const totalCents = cardCostCents + giftCostCents;

  const demosForTier = BUILT_THEME_DEMOS.filter((demo) => demo.tier === card.tier);

  function openUpgradePrompt(feature: UpgradeFeature) {
    setUpgradePrompt(feature);
  }

  function handleUpgradeError(message: string) {
    if (message.includes('Premium themes require')) {
      openUpgradePrompt('premium_theme');
      return true;
    }
    if (message.includes('Gift cards require')) {
      openUpgradePrompt('gift_card');
      return true;
    }
    if (message.includes('Photo limit exceeded') || message.includes('up to 4 photos')) {
      openUpgradePrompt('photos');
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (userPlan === 'FREE' && card.tier === 'PREMIUM') {
      setCard((current) => ({
        ...current,
        tier: 'QUICK',
        musicStyle: 'NONE',
        quickTheme: current.quickTheme || getDefaultQuickTheme(current.occasion)
      }));
      openUpgradePrompt('premium_theme');
    }
  }, [card.tier, userPlan, card.occasion]);

  function withOccasion(nextOccasion: Occasion) {
    const nextRecommendations = getOccasionRecommendations(nextOccasion);
    setCard((current) => ({
      ...current,
      occasion: nextOccasion,
      quickTheme: nextRecommendations.quick.includes(current.quickTheme)
        ? current.quickTheme
        : nextRecommendations.quick[0],
      premiumTheme: nextRecommendations.premium.includes(current.premiumTheme)
        ? current.premiumTheme
        : nextRecommendations.premium[0]
    }));
  }

  function withTier(nextTier: CardTier) {
    if (nextTier === 'PREMIUM' && userPlan === 'FREE') {
      openUpgradePrompt('premium_theme');
      return;
    }

    setCard((current) => ({
      ...current,
      tier: nextTier,
      quickTheme: current.quickTheme || getDefaultQuickTheme(current.occasion),
      premiumTheme: current.premiumTheme || getDefaultPremiumTheme(current.occasion),
      musicStyle: nextTier === 'QUICK' ? 'NONE' : current.musicStyle === 'NONE' ? 'MUSIC_BOX_BIRTHDAY' : current.musicStyle
    }));
  }

  function applyThemeDemo(themeId: string) {
    const selected = BUILT_THEME_DEMOS.find((item) => item.id === themeId);
    if (!selected) {
      return;
    }

    if (selected.tier === 'PREMIUM' && userPlan === 'FREE') {
      openUpgradePrompt('premium_theme');
      return;
    }

    setCard((current) => ({
      ...current,
      tier: selected.tier,
      occasion: current.occasion || selected.occasion,
      quickTheme: selected.quickTheme || current.quickTheme,
      premiumTheme: selected.premiumTheme || current.premiumTheme,
      musicStyle:
        selected.tier === 'PREMIUM'
          ? current.musicStyle === 'NONE'
            ? 'MUSIC_BOX_BIRTHDAY'
            : current.musicStyle
          : 'NONE'
    }));
  }

  function payloadForApi() {
    return {
      title: card.title,
      recipientName: card.recipientName || 'Someone Special',
      occasion: card.occasion,
      tier: card.tier,
      quickTheme: card.tier === 'QUICK' ? card.quickTheme : undefined,
      premiumTheme: card.tier === 'PREMIUM' ? card.premiumTheme : undefined,
      message: card.message || 'A note from the heart',
      sectionMessages: card.sectionMessages,
      musicStyle: card.musicStyle,
      featureToggles: card.featureToggles,
      giftCard: card.giftCard
    };
  }

  async function ensureCardExists() {
    if (card.id) return card.id;

    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadForApi())
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload.error || 'Could not create draft card.';
      handleUpgradeError(message);
      throw new Error(message);
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
        body: JSON.stringify(payloadForApi())
      });

      const payload = await response.json();
      if (!response.ok) {
        const message = payload.error || 'Could not save card draft.';
        handleUpgradeError(message);
        throw new Error(message);
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
      return Boolean(card.recipientName.trim() && card.title.trim() && card.message.trim());
    }
    if (step === 1) {
      return card.tier === 'QUICK' ? card.photos.length === 1 : card.photos.length > 0;
    }
    if (step === 3) {
      return card.tier === 'QUICK' ? Boolean(card.quickTheme) : Boolean(card.premiumTheme);
    }
    return true;
  }, [step, card]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="card-panel p-6">
        <header>
          <p className="ui-label">
            Step {step + 1} of {steps.length}
          </p>
          <h1 className="section-title mt-2 text-4xl">{steps[step]}</h1>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
            <i
              className="block h-full rounded-full bg-[linear-gradient(90deg,#D4A853,#F0D48A)] transition-all"
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
                    : 'border-[var(--color-border-medium)] bg-[var(--color-surface-solid)]'
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
                    onClick={() => withOccasion(value as Occasion)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      card.occasion === value
                        ? 'border-brand-copper bg-brand-copper/10 text-brand-charcoal'
                        : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] text-brand-muted'
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
              <label className="ui-label">Extra section messages (optional)</label>
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

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(cardTierLabels) as CardTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => withTier(tier)}
                  className={`rounded-2xl border p-4 text-left ${
                    card.tier === tier
                      ? 'border-brand-copper bg-brand-copper/10'
                      : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <p className="ui-label">{cardTierLabels[tier]}</p>
                  {tier === 'QUICK' ? (
                    <p className="mt-2 text-sm text-brand-body">One-photo format for rapid delivery.</p>
                  ) : (
                    <p className="mt-2 text-sm text-brand-body">Multi-photo format for richer storytelling.</p>
                  )}
                </button>
              ))}
            </div>

            <p className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-brand-body">
              {card.tier === 'QUICK'
                ? 'Quick cards require exactly 1 photo or text panel.'
                : userPlan === 'FREE'
                ? 'Premium cards allow up to 4 photos or text panels on the Free plan.'
                : 'Premium cards allow up to 12 photos or text panels.'}
            </p>
            <PhotoManager
              photos={card.photos}
              onPhotosChange={(photos) => setCard((current) => ({ ...current, photos }))}
              cardId={card.id}
              ensureCardExists={ensureCardExists}
              userPlan={userPlan}
              tier={card.tier}
              onUpgradeRequired={() => openUpgradePrompt('photos')}
              onStatus={setStatus}
              onBusyChange={setSaving}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <AudioManager
              cardId={card.id}
              audioTrack={card.customAudio}
              ensureCardExists={ensureCardExists}
              onAudioChange={(audio) => setCard((current) => ({ ...current, customAudio: audio }))}
              onStatus={setStatus}
              onBusyChange={setSaving}
            />

            <div className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-4">
              <label className="ui-label">Fallback soundtrack style</label>
              <p className="mt-1 text-xs text-brand-muted">
                Used when no uploaded audio is attached. Uploaded audio always takes priority.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {(card.tier === 'QUICK' ? (['NONE'] as MusicStyle[]) : musicOptions).map((musicStyle) => (
                  <button
                    key={musicStyle}
                    type="button"
                    onClick={() => setCard((current) => ({ ...current, musicStyle }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      card.musicStyle === musicStyle
                        ? 'border-brand-copper bg-brand-copper/10 text-brand-charcoal'
                        : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] text-brand-muted'
                    }`}
                  >
                    {toMusicLabel(musicStyle)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(cardTierLabels) as CardTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => withTier(tier)}
                  className={`rounded-2xl border p-4 text-left ${
                    card.tier === tier
                      ? 'border-brand-copper bg-brand-copper/10'
                      : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <p className="ui-label">{cardTierLabels[tier]}</p>
                  {tier === 'QUICK' ? (
                    <p className="mt-2 text-sm text-brand-body">
                      One photo and cinematic motion. Fast creation in under two minutes.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-brand-body">
                      Multi-photo stories, richer effects, and premium moments.
                    </p>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="ui-label">Recommended for {occasionLabels[card.occasion]}</label>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(card.tier === 'QUICK' ? recommendations.quick : recommendations.premium).map((theme) => (
                  <span key={theme} className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-2.5 py-1">
                    {card.tier === 'QUICK'
                      ? quickThemeLabels[theme as QuickTheme]
                      : premiumThemeLabels[theme as PremiumTheme]}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="ui-label">Pre-generated themes</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {demosForTier.map((theme) => (
                  <article
                    key={theme.id}
                    className={`rounded-2xl border p-3 ${
                      themeSelected(theme, card)
                        ? 'border-brand-copper bg-brand-copper/10'
                        : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    <button type="button" className="w-full text-left" onClick={() => applyThemeDemo(theme.id)}>
                      <div
                        className="h-16 rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})` }}
                      />
                      <p className="section-title mt-2 text-2xl">{getThemeDemoName(theme)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-brand-muted">{theme.collection}</p>
                      <p className="mt-1 text-sm text-brand-body">{theme.description}</p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" className="px-3 py-2 text-xs" onClick={() => applyThemeDemo(theme.id)}>
                        Use Theme
                      </Button>
                      <a href={getThemeDemoPreviewUrl(theme)} target="_blank" rel="noopener noreferrer">
                        <Button tone="secondary" type="button" className="px-3 py-2 text-xs">
                          Demo
                        </Button>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <label className="ui-label">Interactive features</label>
              <div className="mt-2 space-y-2">
                {Object.entries(card.featureToggles).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] px-3 py-2"
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
            <div className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-3">
              <label className="flex items-center justify-between">
                <span className="ui-label">Include gift card</span>
                <input
                  type="checkbox"
                  checked={Boolean(card.giftCard)}
                  onChange={(event) => {
                    if (event.target.checked && userPlan === 'FREE') {
                      openUpgradePrompt('gift_card');
                      return;
                    }
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

              {userPlan === 'FREE' ? (
                <p className="mt-2 text-xs text-brand-copper">Gift cards are available on Premium and Pro plans.</p>
              ) : null}

              {card.giftCard ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="ui-label">Brand</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-3 py-2 text-[var(--color-text-primary)]"
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
                              : 'border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] text-brand-muted'
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
            <div className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-4">
              <p className="ui-label">Order summary</p>
              <ul className="mt-2 space-y-1.5 text-sm text-brand-body">
                <li>
                  Occasion: {occasionLabels[card.occasion]} for {card.recipientName || 'Recipient'}
                </li>
                <li>Type: {cardTierLabels[card.tier]}</li>
                <li>Theme: {selectedThemeLabel}</li>
                <li>
                  Media: {card.photos.filter((p) => p.slotType !== 'TEXT_PANEL').length} photo{card.photos.filter((p) => p.slotType !== 'TEXT_PANEL').length !== 1 ? 's' : ''}
                  {card.photos.filter((p) => p.slotType === 'TEXT_PANEL').length > 0
                    ? `, ${card.photos.filter((p) => p.slotType === 'TEXT_PANEL').length} text panel${card.photos.filter((p) => p.slotType === 'TEXT_PANEL').length !== 1 ? 's' : ''}`
                    : ''}
                </li>
                <li>{audioSummary(card)}</li>
                <li>Features: {Object.entries(card.featureToggles).filter(([, enabled]) => enabled).length} enabled</li>
                {card.giftCard ? (
                  <li>
                    Gift card: {card.giftCard.brand} {formatUsd(card.giftCard.amount)}
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button tone="secondary" type="button" onClick={generatePreview} disabled={saving}>
                Generate Preview
              </Button>
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button tone="secondary" type="button">
                    Open Full Preview
                  </Button>
                </a>
              ) : null}
              <Button type="button" onClick={completeCheckout} disabled={saving}>
                Complete & Send
              </Button>
            </div>
          </div>
        ) : null}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-4">
          <div className="flex gap-2">
            <Button
              tone="secondary"
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button tone="secondary" type="button" onClick={saveDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
            disabled={!canContinue || step === steps.length - 1}
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
          <div className="flex justify-between gap-3">
            <dt>Occasion</dt>
            <dd>{occasionLabels[card.occasion]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Type</dt>
            <dd>{cardTierLabels[card.tier]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Theme</dt>
            <dd>{selectedThemeLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Media</dt>
            <dd>
              {(() => {
                const photoCount = card.photos.filter((p) => p.slotType !== 'TEXT_PANEL').length;
                const textCount = card.photos.filter((p) => p.slotType === 'TEXT_PANEL').length;
                const parts: string[] = [];
                if (photoCount > 0) parts.push(`${photoCount} photo${photoCount !== 1 ? 's' : ''}`);
                if (textCount > 0) parts.push(`${textCount} text`);
                return parts.length > 0 ? parts.join(', ') : '0';
              })()}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Status</dt>
            <dd>{card.status || 'DRAFT'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Audio</dt>
            <dd>{card.customAudio?.name || toMusicLabel(card.musicStyle)}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm text-brand-body">
          <div className="flex justify-between">
            <span>{card.tier === 'QUICK' ? 'Quick card' : 'Premium card'}</span>
            <span>{formatUsd(cardCostCents)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Gift card</span>
            <span>{formatUsd(giftCostCents)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold text-brand-charcoal">
            <span>Total</span>
            <span>{formatUsd(totalCents)}</span>
          </div>
        </div>

        {previewUrl ? (
          <div className="mt-5 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-3">
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

      {upgradePrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] p-5 shadow-xl">
            <p className="ui-label">Upgrade required</p>
            <h3 className="section-title mt-2 text-3xl">{UPGRADE_PROMPTS[upgradePrompt].title}</h3>
            <p className="mt-3 text-sm text-brand-body">{UPGRADE_PROMPTS[upgradePrompt].message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/pricing">
                <Button type="button">View plans</Button>
              </Link>
              <Button type="button" tone="secondary" onClick={() => setUpgradePrompt(null)}>
                Continue on Free
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
