import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/signout-button';
import { CreateWizard } from '@/components/studio/create-wizard';
import { auth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { parseECardIntegrationSeed } from '@/lib/integrations/ecard-seed';
import { buildCreateThemeUrl, parseCreateThemePreset } from '@/lib/themes/presets';

type CreateSearchParams = {
  cardId?: string;
  tier?: string;
  quickTheme?: string;
  premiumTheme?: string;
  occasion?: string;
  recipientName?: string;
  recipient_name?: string;
  message?: string;
  backgroundMusic?: string;
  background_music?: string;
  giftCardSelection?: string;
  gift_card_selection?: string;
  themeSelection?: string;
  theme_selection?: string;
  theme?: string;
};

function parseCustomAudio(paintData: unknown) {
  if (!paintData || typeof paintData !== 'object' || Array.isArray(paintData)) {
    return null;
  }

  const customAudio = (paintData as Record<string, unknown>).customAudio;
  if (!customAudio || typeof customAudio !== 'object' || Array.isArray(customAudio)) {
    return null;
  }

  const url = (customAudio as Record<string, unknown>).url;
  const name = (customAudio as Record<string, unknown>).name;
  const mimeType = (customAudio as Record<string, unknown>).mimeType;
  const bytes = (customAudio as Record<string, unknown>).bytes;
  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }

  return {
    url,
    name: typeof name === 'string' ? name : 'Custom Audio',
    mimeType: typeof mimeType === 'string' ? mimeType : undefined,
    bytes: typeof bytes === 'number' ? bytes : undefined
  };
}

function buildCallbackUrl(searchParams?: CreateSearchParams) {
  const params = new URLSearchParams();
  const entries = Object.entries(searchParams || {});

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append(key, entry);
        }
      });
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/create?${query}` : '/create';
}

export default async function CreatePage({ searchParams }: { searchParams?: CreateSearchParams }) {
  const preset = parseCreateThemePreset(searchParams);
  const integrationSeed = parseECardIntegrationSeed(searchParams);
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = buildCallbackUrl(searchParams) || buildCreateThemeUrl(preset, { cardId: searchParams?.cardId });
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true }
  });
  const userPlan = userRecord?.plan || session.user.plan;

  let initialCard: Record<string, unknown> | undefined;

  if (!searchParams?.cardId) {
    const seedCard = {
      ...integrationSeed,
      ...preset,
      occasion: preset.occasion || integrationSeed.occasion,
      tier: preset.tier || integrationSeed.tier,
      quickTheme: preset.quickTheme || integrationSeed.quickTheme,
      premiumTheme: preset.premiumTheme || integrationSeed.premiumTheme
    };

    if (Object.values(seedCard).some((value) => value !== undefined)) {
      initialCard = seedCard;
    }
  }

  if (searchParams?.cardId) {
    let card = null;
    try {
      card = await prisma.card.findFirst({
        where: {
          id: searchParams.cardId,
          userId: session.user.id
        },
        include: {
          photos: {
            orderBy: { sortOrder: 'asc' }
          },
          giftCard: true
        }
      });
    } catch (error) {
      console.error('Failed to load existing card for /create.', error);
    }

    if (card) {
      initialCard = {
        id: card.id,
        slug: card.slug,
        title: card.title,
        recipientName: card.recipientName,
        occasion: card.occasion,
        tier: card.tier,
        quickTheme: card.quickTheme,
        premiumTheme: card.premiumTheme,
        message: card.message,
        sectionMessages: Array.isArray(card.sectionMessages)
          ? card.sectionMessages.map((line) => String(line))
          : [],
        musicStyle: card.musicStyle,
        featureToggles:
          card.featureToggles && typeof card.featureToggles === 'object'
            ? (card.featureToggles as Record<string, boolean>)
            : undefined,
        status: card.status,
        photos: card.photos,
        giftCard: card.giftCard
          ? {
              brand: card.giftCard.brand,
              tremendousProductId: card.giftCard.tremendousProductId || undefined,
              amount: card.giftCard.amount,
              currency: card.giftCard.currency
            }
          : null,
        customAudio: parseCustomAudio(card.paintData)
      };
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-label">Card creation wizard</p>
          <h1 className="section-title text-5xl">Create a living card</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <button className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-4 py-2 text-sm text-brand-muted">
              Dashboard
            </button>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <CreateWizard initialCard={initialCard as never} userPlan={userPlan} />
    </main>
  );
}
