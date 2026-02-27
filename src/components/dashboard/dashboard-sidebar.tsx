'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plan } from '@prisma/client';
import { CreditCard, LayoutDashboard, Menu, Palette, Plus, Settings, X } from 'lucide-react';
import { SignOutButton } from '@/components/auth/signout-button';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  section?: string;
};

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Create Card',
    href: '/create',
    icon: Plus
  },
  {
    label: 'Theme Gallery',
    href: '/dashboard?section=themes#theme-gallery',
    icon: Palette,
    section: 'themes'
  },
  {
    label: 'Billing',
    href: '/pricing',
    icon: CreditCard
  },
  {
    label: 'Settings',
    href: '/dashboard?section=settings',
    icon: Settings,
    section: 'settings'
  }
];

const planTone: Record<Plan, string> = {
  FREE: 'border-slate-600 bg-slate-800 text-slate-300',
  PREMIUM: 'border-amber-600 bg-amber-900/50 text-amber-300',
  PRO: 'border-emerald-600 bg-emerald-900/50 text-emerald-300'
};

export function DashboardSidebar({
  userName,
  userPlan
}: {
  userName?: string | null;
  userPlan: Plan;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParams]);

  function isActive(item: NavItem) {
    const section = searchParams.get('section');

    if (item.href.startsWith('/dashboard')) {
      if (pathname !== '/dashboard') {
        return false;
      }
      if (item.section) {
        return section === item.section;
      }
      return !section;
    }

    return pathname === item.href;
  }

  const displayName = userName?.trim() || 'Creator';

  const sidebarContent = (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] p-4">
        <p className="ui-label">LiveCardStudio</p>
        <p className="section-title mt-1 text-2xl">{displayName}</p>
        <span className={cn('mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold', planTone[userPlan])}>
          {userPlan}
        </span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                isActive(item)
                  ? 'bg-brand-copper text-white'
                  : 'text-brand-muted hover:bg-[var(--color-surface-hover)] hover:text-brand-charcoal'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <SignOutButton />
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between">
          <p className="section-title text-2xl">Dashboard</p>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)]"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5 text-brand-muted" /> : <Menu className="h-5 w-5 text-brand-muted" />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden">
          <aside className="h-full w-72 border-r border-[var(--color-border)] bg-[var(--color-surface-solid)] backdrop-blur-md">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-60 border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] backdrop-blur-md lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}

