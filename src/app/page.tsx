import Link from 'next/link';
import { CanvasBackground } from '@/components/landing/canvas-background';
import { LandingNav } from '@/components/landing/landing-nav';
import { Reveal } from '@/components/landing/reveal';
import { DemoCanvas } from '@/components/landing/demo-canvas';
import { FeatureCanvas } from '@/components/landing/feature-canvas';
import { ThemeGallery } from '@/components/landing/theme-gallery';
import { BILLING_PRICES } from '@/lib/billing/pricing';
import { formatUsd } from '@/lib/utils';

export default function LandingPage() {
  const signupUrl = { pathname: '/signup', query: { callbackUrl: '/create' } };

  return (
    <div className="relative min-h-screen text-dark-cream">
      <CanvasBackground />
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 inline-block rounded-full border border-dark-gold/30 bg-dark-gold/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold backdrop-blur-sm">
          Living Digital Cards
        </span>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-8xl">
          Send Cards That
          <br />
          <em className="inline-block bg-gradient-to-r from-dark-gold to-dark-gold-light bg-clip-text pb-2 font-script text-[1.15em] not-italic leading-[1.2] text-transparent">
            Breathe
          </em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-body)] md:text-xl">
          Handcrafted, interactive cards with ambient soundscapes, 3D photos, paint canvas,
          and surprise gift reveals — delivered through a single beautiful link.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={signupUrl}
            className="rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-widest text-dark-midnight shadow-[0_8px_30px_rgba(212,168,83,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,168,83,0.45)]"
          >
            Start Creating — It&apos;s Free
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-[var(--color-border-strong)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-[var(--color-text-body)] backdrop-blur-sm transition hover:border-dark-gold/40 hover:text-dark-cream"
          >
            See How It Works
          </a>
        </div>
        {/* scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-gold/60">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── Meta callout ── */}
      <Reveal>
        <div className="relative z-10 py-10 text-center">
          <p className="font-script text-2xl text-dark-gold/70 md:text-3xl">
            ✦ This page is a living card — scroll to feel the difference ✦
          </p>
        </div>
      </Reveal>

      {/* ── Problem Section ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            The Problem
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Every card option today is{' '}
            <em className="bg-gradient-to-r from-dark-gold to-dark-gold-light bg-clip-text font-script text-[1.1em] not-italic text-transparent">
              broken
            </em>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: '😐',
                title: 'Generic E-Cards',
                desc: 'Clip-art GIFs from 2005. No soul, no craft, instantly forgotten.'
              },
              {
                emoji: '🌲',
                title: 'Paper Cards',
                desc: "Beautiful but wasteful, slow to deliver, and can't play your song."
              },
              {
                emoji: '📱',
                title: 'Text Messages',
                desc: '"Happy birthday 🎂" — lost in a sea of notifications. Zero magic.'
              }
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface)] p-8 text-center backdrop-blur-sm transition hover:border-dark-gold/30"
              >
                <span className="text-4xl">{card.emoji}</span>
                <h3 className="mt-4 font-display text-xl font-bold">{card.title}</h3>
                <p className="mt-3 text-[var(--color-text-body)]">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── How It Works ── */}
      <Reveal>
        <section id="how-it-works" className="relative z-10 mx-auto max-w-4xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            How It Works
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Three steps to{' '}
            <em className="font-script text-dark-gold-light not-italic">unforgettable</em>
          </h2>
          <div className="relative mt-16">
            {/* connecting line */}
            <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-dark-gold/60 via-dark-gold/30 to-transparent md:left-1/2 md:block" />
            {[
              {
                num: '01',
                title: 'Choose Your Moment',
                desc: 'Pick an occasion, upload your favorite photos, and set the emotional tone. Birthday, anniversary, congratulations — we have themes for every feeling.'
              },
              {
                num: '02',
                title: 'Add a Little Magic',
                desc: 'Select ambient soundscapes, interactive effects, and personal touches. Every card is a miniature world your recipient can explore.'
              },
              {
                num: '03',
                title: 'Send With Love',
                desc: 'Share one beautiful link. No app needed — it works on every phone, tablet, and computer. Watch their reaction through read receipts.'
              }
            ].map((step) => (
              <div key={step.num} className="relative mb-12 md:flex md:items-start md:gap-8">
                <div className="flex items-center gap-4 md:w-1/2 md:justify-end">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dark-gold bg-dark-midnight font-display text-lg font-bold text-dark-gold">
                    {step.num}
                  </div>
                  <h3 className="font-display text-2xl font-bold md:hidden">{step.title}</h3>
                </div>
                <div className="mt-3 md:mt-0 md:w-1/2">
                  <h3 className="hidden font-display text-2xl font-bold md:block">{step.title}</h3>
                  <p className="mt-2 text-[var(--color-text-body)]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Features ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            Features
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Crafted with{' '}
            <em className="font-script text-dark-gold-light not-italic">obsessive</em> detail
          </h2>
        </Reveal>

        {[
          {
            title: 'Ambient Soundscapes',
            desc: 'Music-box melodies, rain on glass, crackling fire — built with Web Audio for warm, layered sound that plays automatically.',
            visual: 'waves' as const
          },
          {
            title: '3D Photo Galleries',
            desc: 'Tilt, parallax, and brushstroke reveals bring photos to life. Each image tells part of the story.',
            visual: 'particles' as const
          },
          {
            title: 'Interactive Paint Canvas',
            desc: 'Recipients can paint watercolors directly on the card — it becomes a collaboration, a shared moment.',
            visual: 'spiral' as const
          }
        ].map((feature, i) => (
          <Reveal key={feature.title}>
            <div
              className={`mt-16 flex flex-col items-center gap-10 md:flex-row ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="md:w-1/2">
                <h3 className="font-display text-3xl font-bold">{feature.title}</h3>
                <p className="mt-4 text-lg text-[var(--color-text-body)]">{feature.desc}</p>
              </div>
              <div className="flex md:w-1/2 md:justify-center">
                <FeatureCanvas type={feature.visual} />
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── Trust Signals ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: '🔒', title: 'Private & Secure', desc: 'Your photos and messages stay yours.' },
              { icon: '⚡', title: 'Instant Delivery', desc: 'One link, works everywhere. No app needed.' },
              { icon: '🌱', title: 'Zero Waste', desc: 'Beautiful cards without the paper trail.' },
              {
                icon: '🎨',
                title: 'Artist-Crafted',
                desc: 'Every theme designed by hand, not generated.'
              }
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-3xl">{item.icon}</span>
                <h4 className="mt-3 font-display text-lg font-bold">{item.title}</h4>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            Loved by Senders
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Real reactions, real{' '}
            <em className="font-script text-dark-gold-light not-italic">tears</em>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Replace with real customer quotes when available */}
            {[
              {
                quote: "My mom literally cried. She kept tapping and swiping and said it was the most thoughtful thing she'd ever received.",
                name: 'Sarah K.',
                occasion: "Mother's Day",
                stars: 5
              },
              {
                quote: "We used LiveCard for our wedding thank-yous. Every single guest texted us about how beautiful they were.",
                name: 'James & Priya',
                occasion: 'Wedding',
                stars: 5
              },
              {
                quote: "I've sent birthday cards to my whole family now. The soundscapes and photo galleries are on another level.",
                name: 'Marcus T.',
                occasion: 'Birthday',
                stars: 5
              }
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface)] p-8 backdrop-blur-sm"
              >
                <div className="flex gap-0.5 text-dark-gold">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i}>&#9733;</span>
                  ))}
                </div>
                <p className="mt-4 text-[var(--color-text-body)]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  <p className="font-display font-bold">{t.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.occasion} card</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Interactive Demos ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            Experience
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Feel the <em className="font-script text-dark-gold-light not-italic">atmosphere</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-text-body)]">
            Each theme creates a unique emotional world. Hover over these live canvases to interact.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(
              [
                { type: 'celestial' as const, label: 'Celestial Night', color: '#D4A853' },
                { type: 'garden' as const, label: 'Secret Garden', color: '#7BC47F' },
                { type: 'ocean' as const, label: 'Deep Ocean', color: '#5B8DEF' },
                { type: 'aurora' as const, label: 'Aurora Dreams', color: '#C084FC' }
              ] as const
            ).map((demo) => (
              <div
                key={demo.type}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface)] backdrop-blur-sm transition hover:border-dark-gold/40"
              >
                <DemoCanvas type={demo.type} />
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h3 className="font-display text-lg font-bold">{demo.label}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">Hover or tap to interact</p>
                  </div>
                  <Link
                    href={signupUrl}
                    className="rounded-full border border-dark-gold/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-dark-gold transition hover:bg-dark-gold hover:text-dark-midnight"
                  >
                    Use This Theme
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Theme Demo Gallery ── */}
      <Reveal>
        <section id="gallery" className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            Theme Gallery
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Choose your <em className="font-script text-dark-gold-light not-italic">visual world</em>
          </h2>
          <ThemeGallery />
        </section>
      </Reveal>

      {/* ── Pricing ── */}
      <Reveal>
        <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">Pricing</p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            Built for occasional senders and power creators
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Free',
                price: formatUsd(BILLING_PRICES.planMonthlyCents.FREE),
                period: '/month',
                features: ['Quick cards', '1 photo or text panel', 'No gift card reveals', 'Send cost: $0 for quick cards'],
                cta: 'Start Free',
                highlight: false
              },
              {
                name: 'Premium',
                price: formatUsd(BILLING_PRICES.planMonthlyCents.PREMIUM),
                period: '/month',
                features: [
                  'Premium themes + gift reveals',
                  'Up to 12 photos or text panels',
                  `Send cost: ${formatUsd(BILLING_PRICES.cardCents.QUICK)} quick card`,
                  `Send cost: ${formatUsd(BILLING_PRICES.cardCents.PREMIUM)} premium card`
                ],
                cta: 'Upgrade to Premium',
                highlight: true
              },
              {
                name: 'Pro',
                price: formatUsd(BILLING_PRICES.planMonthlyCents.PRO),
                period: '/month',
                features: ['Everything in Premium', 'Up to 12 photos or text panels', 'Send cost: $0 quick + premium cards'],
                cta: 'Upgrade to Pro',
                highlight: false
              }
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 text-center backdrop-blur-sm transition ${
                  tier.highlight
                    ? 'border-dark-gold/50 bg-dark-gold/5 shadow-[0_0_60px_rgba(212,168,83,0.15)]'
                    : 'border-[var(--color-border-medium)] bg-[var(--color-surface)]'
                }`}
              >
                {tier.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-dark-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-dark-gold">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{tier.name}</h3>
                <div className="mt-3">
                  <span className="font-display text-4xl font-bold text-dark-gold">{tier.price}</span>
                  <span className="ml-1 text-sm text-[var(--color-text-muted)]">{tier.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-left">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[var(--color-text-body)]">
                      <span className="text-dark-gold">+</span> {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`mt-8 block rounded-full py-3 text-sm font-bold uppercase tracking-widest transition ${
                    tier.highlight
                      ? 'bg-gold-gradient text-dark-midnight shadow-[0_8px_30px_rgba(212,168,83,0.3)] hover:-translate-y-0.5'
                      : 'border border-[var(--color-border-strong)] text-[var(--color-text-body)] hover:border-dark-gold/40 hover:text-dark-cream'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Coming Soon ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-dark-gold">
            Coming Soon
          </p>
          <h2 className="mt-4 text-center font-display text-4xl font-bold md:text-5xl">
            The future of <em className="font-script text-dark-gold-light not-italic">feeling</em>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'NFC Duo & Gift Sets',
                desc: 'Multi-card NFC bundles with matching packaging — perfect for couples, families, or gifting several people at once.'
              },
              {
                title: 'E-Gift Card Pairing',
                desc: 'Hide a gift card reveal inside the card experience. They discover it as part of the emotional journey, not as a cold email forward.'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-dashed border-dark-gold/30 bg-[var(--color-surface)] p-8 backdrop-blur-sm"
              >
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-[var(--color-text-body)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Guarantee ── */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-dark-gold/30 bg-dark-gold/5 p-8 text-center backdrop-blur-sm">
            <p className="font-script text-2xl text-dark-gold">The &quot;Tears of Joy&quot; Guarantee</p>
            <p className="mt-3 text-[var(--color-text-body)]">
              If your recipient doesn&apos;t love their card, we&apos;ll refund you — no questions asked.
              We&apos;re that confident in the experience.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── Final CTA ── */}
      <Reveal>
        <section className="relative z-10 py-24 text-center">
          <h2 className="font-display text-4xl font-bold md:text-6xl">
            Stop sending cards that
            <br />
            <em className="bg-gradient-to-r from-dark-gold to-dark-gold-light bg-clip-text font-script text-[1.15em] not-italic text-transparent">
              die on arrival
            </em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-text-body)]">
            Create a living, breathing card in under 5 minutes. Free to start.
          </p>
          <Link
            href={signupUrl}
            className="mt-10 inline-block rounded-full bg-gold-gradient px-10 py-5 text-sm font-bold uppercase tracking-widest text-dark-midnight shadow-[0_8px_30px_rgba(212,168,83,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,168,83,0.45)]"
          >
            Create Your First Card
          </Link>
        </section>
      </Reveal>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[var(--color-border)] py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6 px-6 text-sm text-[var(--color-text-muted)]">
          <p className="font-display text-lg text-dark-gold">
            LiveCard<span className="font-normal text-dark-cream">Studio</span>
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/pricing" className="transition hover:text-dark-cream">Pricing</Link>
            <Link href="/faq" className="transition hover:text-dark-cream">FAQ</Link>
            <Link href="/privacy" className="transition hover:text-dark-cream">Privacy</Link>
            <Link href="/terms" className="transition hover:text-dark-cream">Terms</Link>
            <Link href="/contact" className="transition hover:text-dark-cream">Contact</Link>
          </div>
          <p>Made with love in California</p>
        </div>
      </footer>
    </div>
  );
}

