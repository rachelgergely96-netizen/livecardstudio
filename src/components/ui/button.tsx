import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, tone = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gold/40 disabled:cursor-not-allowed disabled:opacity-60',
        tone === 'primary' && 'bg-gold-gradient text-dark-midnight shadow-soft',
        tone === 'secondary' &&
          'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] backdrop-blur-sm hover:bg-[var(--color-surface-hover)]',
        tone === 'ghost' && 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
        className
      )}
      {...props}
    />
  );
}
