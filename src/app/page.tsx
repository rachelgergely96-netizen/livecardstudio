import Link from 'next/link';
import { ArrowRight, Gift, ImageIcon, Music2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Choose your moment',
    description: 'Pick an occasion, upload photos, and set the emotional tone.'
  },
  {
    title: 'Add a little magic',
    description: 'Select theme, soundtrack, and interactive touches that feel handcrafted.'
  },
  {
    title: 'Send with love',
    description: 'Share one beautiful link with everyone, no app download required.'
  }
];

const features = [
  {
    title: 'Interactive photos',
    description: '3D tilt, brushstroke reveals, and tactile photo storytelling.',
    icon: ImageIcon
  },
  {
    title: 'Ambient sound',
    description: 'Music-box melodies and warm ambient layers built with Web Audio.',
    icon: Music2
  },
  {
    title: 'Paint canvas',
    description: 'Recipients can paint directly on the card and make it their own.',
    icon: Palette
  },
  {
    title: 'E-gift cards',
    description: 'Hide a surprise gift reveal inside the experience.',
    icon: Gift
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-brand-charcoal">
      <div className="wash-overlay" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl text-brand-copper">
          LiveCardStudio<span className="text-brand-gold">.com</span>
        </Link>
        <nav className="hidden gap-7 text-sm text-brand-muted md:flex">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden text-sm text-brand-muted md:inline">
            Login
          </Link>
          <Link href="/create">
            <Button>Create Your Card</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="ui-label">Living cards for the moments that matter</p>
            <h1 className="section-title mt-4 text-5xl leading-[0.96] md:text-7xl">
              Handcrafted digital cards that feel like gifts
            </h1>
            <p className="serif-copy mt-6 max-w-xl text-2xl leading-relaxed text-brand-body">
              Handcrafted, interactive, and unforgettable. Send a card that moves, plays music, and lets them paint
              on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create">
                <Button className="gap-2">
                  Create Your Card <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#demo">
                <Button tone="secondary">See a demo</Button>
              </a>
            </div>
          </div>

          <div className="card-panel relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4a57433] via-transparent to-[#c4b0d444]" />
            <div className="relative">
              <p className="ui-label">Sample Moment</p>
              <h2 className="section-title mt-3 text-4xl italic">Happy Birthday, Maya</h2>
              <p className="serif-copy mt-4 text-xl leading-relaxed text-brand-body">
                &quot;This card sings for you. Scroll through memories. Paint a little watercolor before the confetti
                finale.&quot;
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl bg-[linear-gradient(135deg,#d4a574,#f0d9bc)]" />
                <div className="h-24 rounded-xl bg-[linear-gradient(135deg,#c4b0d4,#f1e8f5)]" />
                <div className="h-24 rounded-xl bg-[linear-gradient(135deg,#c87941,#edc599)]" />
                <div className="h-24 rounded-xl bg-[linear-gradient(135deg,#e8d6c1,#fdf8f0)]" />
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="pt-8">
          <p className="ui-label text-center">How it works</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <article key={step.title} className="card-panel p-6">
                <p className="ui-label">Step {idx + 1}</p>
                <h3 className="section-title mt-3 text-3xl">{step.title}</h3>
                <p className="serif-copy mt-3 text-xl text-brand-body">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="demo" className="pt-14">
          <div className="card-panel overflow-hidden p-4 md:p-6">
            <p className="ui-label">Live demo preview</p>
            <h3 className="section-title mt-3 text-3xl">Every card is a living, breathing work of art</h3>
            <p className="serif-copy mt-3 text-xl text-brand-body">
              The recipient experience is interactive, animated, and built to feel intimate on mobile.
            </p>
            <iframe
              title="Live card demo"
              src="/c/demo"
              className="mt-5 h-[520px] w-full rounded-2xl border border-[rgba(200,160,120,0.2)] bg-[#fffaf3]"
            />
          </div>
        </section>

        <section id="features" className="pt-14">
          <p className="ui-label text-center">Feature showcase</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="card-panel flex gap-4 p-6">
                <div className="mt-1 rounded-xl border border-[rgba(200,160,120,0.24)] bg-white/70 p-2.5">
                  <feature.icon className="h-5 w-5 text-brand-copper" />
                </div>
                <div>
                  <h4 className="section-title text-2xl">{feature.title}</h4>
                  <p className="serif-copy mt-2 text-xl text-brand-body">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="pt-14">
          <p className="ui-label text-center">Pricing</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ['Free', '1 card, basic themes, up to 4 photos'],
              ['Premium', '$19 per card, all themes + music + gift option'],
              ['Pro', '$19/mo unlimited cards and premium features'],
              ['Enterprise', 'Corporate gifting, custom workflows']
            ].map(([title, text]) => (
              <article key={title} className="card-panel p-5">
                <h4 className="section-title text-2xl">{title}</h4>
                <p className="serif-copy mt-2 text-xl text-brand-body">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(200,160,120,0.2)] bg-[#fffaf3]/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-brand-muted">
          <p>LiveCardStudio.com</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <p>Made with love in California</p>
        </div>
      </footer>
    </div>
  );
}
