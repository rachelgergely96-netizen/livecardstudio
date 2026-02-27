'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-5 transition-all duration-400 md:px-8 ${
        scrolled
          ? 'border-b border-[rgba(212,168,83,0.15)] bg-[rgba(13,10,20,0.85)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <Link href="/" className="font-display text-2xl font-bold text-dark-gold">
        LiveCard<span className="font-normal text-dark-cream">Studio</span>
      </Link>

      <nav className="hidden items-center gap-6 md:flex">
        <a href="#how-it-works" className="text-sm text-[var(--color-text-muted)] transition hover:text-dark-cream">
          How It Works
        </a>
        <a href="#gallery" className="text-sm text-[var(--color-text-muted)] transition hover:text-dark-cream">
          Gallery
        </a>
        <a href="#pricing" className="text-sm text-[var(--color-text-muted)] transition hover:text-dark-cream">
          Pricing
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm text-[var(--color-text-muted)] transition hover:text-dark-cream"
        >
          Log In
        </Link>
        <Link
          href={{ pathname: '/signup', query: { callbackUrl: '/create' } }}
          className="rounded-full bg-dark-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-dark-midnight transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,83,0.35)]"
        >
          Create Your First Card
        </Link>
      </div>
    </header>
  );
}
