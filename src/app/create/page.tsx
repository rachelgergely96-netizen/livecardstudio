import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/signout-button';
import { CreateWizard } from '@/components/studio/create-wizard';
import { auth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { buildCreateThemeUrl, parseCreateThemePreset } from '@/lib/themes/presets';

type CreateSearchParams = {
  cardId?: string;
  tier?: string;
  quickTheme?: string;
  premiumTheme?: string;
  occasion?: string;
};

export default async function CreatePage({ searchParams }: { searchParams?: CreateSearchParams }) {
  const preset = parseCreateThemePreset(searchParams);
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = buildCreateThemeUrl(preset, { cardId: searchParams?.cardId });
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  let initialCard: Record<string, unknown> | undefined;

  if (!searchParams?.cardId && Object.keys(preset).length > 0) {
    initialCard = {
      ...preset
    };
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
          : null
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
            <button className="rounded-full border border-[rgba(200,160,120,0.28)] bg-[#fffaf4] px-4 py-2 text-sm text-brand-muted">
              Dashboard
            </button>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <CreateWizard initialCard={initialCard as never} userPlan={session.user.plan} />
    </main>
  );
}
