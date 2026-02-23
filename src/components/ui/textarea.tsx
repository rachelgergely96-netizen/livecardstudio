import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-[rgba(200,160,120,0.28)] bg-[#fffdf9] px-3 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-muted/70 focus:border-brand-copper/50 focus:outline-none focus:ring-2 focus:ring-brand-copper/20',
        className
      )}
      {...props}
    />
  );
}
