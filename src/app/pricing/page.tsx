import Link from 'next/link';
import { Plan } from '@prisma/client';
import { UpgradePlanButton } from '@/components/billing/upgrade-plan-button';
import { auth } from '@/lib/auth/session';
import { BILLING_PRICES } from '@/lib/billing/pricing';
import { prisma } from '@/lib/db/prisma';
import { formatUsd } from '@/lib/utils';

function planSubtitle(plan: Plan) {
  if (plan === 'FREE') {
    return 'Quick cards, one-item stories, and no monthly fee.';
  }
  if (plan === 'PREMIUM') {
    return 'Unlock premium themes and gift reveals for monthly subscribers.';
  }
  return 'Best value for frequent creators who want all sending costs included.';
}

export default async function PricingPage() {
  const session = await auth();
  const userRecord = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true }
      })
    : null;
  const userPlan = userRecord?.plan || session?.user?.plan || null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-brand-charcoal">
      <p className="ui-label">LiveCardStudio</p>
      <h1 className="section-title mt-3 text-5xl">Plans & pricing</h1>
      <p className="serif-copy mt-4 max-w-3xl text-2xl text-brand-body">
        Choose a creator plan, then pay per card only when applicable. Pricing below matches checkout and in-app
        gating rules.
      </p>

      {userPlan ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm">
          <span className="ui-label">Current plan</span>
          <span className="font-semibold">{userPlan}</span>
          <span className="text-brand-muted">- {planSubtitle(userPlan)}</span>
        </div>
      ) : null}

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <article className="card-panel p-6">
          <p className="ui-label">Free</p>
          <p className="section-title mt-2 text-4xl">{formatUsd(BILLING_PRICES.planMonthlyCents.FREE)}/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-body">
            <li>Quick cards only</li>
            <li>Exactly 1 photo or text panel</li>
            <li>No gift card reveals</li>
            <li>Quick card send cost: {formatUsd(0)}</li>
          </ul>
          <div className="mt-6">
            <Link
              href={session?.user?.id ? '/create' : '/signup?callbackUrl=/create'}
              className="inline-flex w-full items-center justify-center rounded-full border border-[var(--color-border-medium)] px-4 py-2 text-sm font-semibold"
            >
              {session?.user?.id ? 'Create a Card' : 'Start Free'}
            </Link>
          </div>
        </article>

        <article className="card-panel border-brand-copper/40 bg-brand-copper/5 p-6">
          <p className="ui-label">Premium</p>
          <p className="section-title mt-2 text-4xl">{formatUsd(BILLING_PRICES.planMonthlyCents.PREMIUM)}/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-body">
            <li>Premium themes unlocked</li>
            <li>Gift card reveals unlocked</li>
            <li>Up to 12 photos or text panels</li>
            <li>Quick card send cost: {formatUsd(BILLING_PRICES.cardCents.QUICK)}</li>
            <li>Premium card send cost: {formatUsd(BILLING_PRICES.cardCents.PREMIUM)}</li>
          </ul>
          <div className="mt-6">
            {session?.user?.id ? (
              <UpgradePlanButton targetPlan="PREMIUM" currentPlan={userPlan} />
            ) : (
              <Link
                href="/signup?callbackUrl=/pricing"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white"
              >
                Sign Up to Upgrade
              </Link>
            )}
          </div>
        </article>

        <article className="card-panel p-6">
          <p className="ui-label">Pro</p>
          <p className="section-title mt-2 text-4xl">{formatUsd(BILLING_PRICES.planMonthlyCents.PRO)}/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-body">
            <li>Everything in Premium</li>
            <li>Up to 12 photos or text panels</li>
            <li>Quick and premium card send cost: {formatUsd(0)}</li>
            <li>Best for high-volume studios</li>
          </ul>
          <div className="mt-6">
            {session?.user?.id ? (
              <UpgradePlanButton targetPlan="PRO" currentPlan={userPlan} />
            ) : (
              <Link
                href="/signup?callbackUrl=/pricing"
                className="inline-flex w-full items-center justify-center rounded-full border border-[var(--color-border-medium)] px-4 py-2 text-sm font-semibold"
              >
                Sign Up to Upgrade
              </Link>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
