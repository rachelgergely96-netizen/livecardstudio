import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, tone = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 disabled:cursor-not-allowed disabled:opacity-60',
        tone === 'primary' && 'bg-brand-copper text-white shadow-soft hover:bg-[#b86f3c]',
        tone === 'secondary' &&
          'border border-[rgba(200,160,120,0.3)] bg-[#fffaf4] text-brand-charcoal hover:bg-[#f8ecdf]',
        tone === 'ghost' && 'text-brand-muted hover:text-brand-charcoal',
        className
      )}
      {...props}
    />
  );
}
