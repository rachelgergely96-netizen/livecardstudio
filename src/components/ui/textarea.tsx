import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-dark-gold/50 focus:outline-none focus:ring-2 focus:ring-dark-gold/20',
        className
      )}
      {...props}
    />
  );
}
