'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CopyLinkButtonProps = {
  url: string;
  className?: string;
  label?: string;
  iconOnly?: boolean;
};

export function CopyLinkButton({ url, className, label = 'Copy Link', iconOnly = false }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const ariaLabel = copied ? 'Copied' : label;

  return (
    <Button
      type="button"
      tone="secondary"
      className={cn(iconOnly ? 'h-9 w-9 p-0' : 'px-3 py-2 text-xs', className)}
      onClick={handleCopy}
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      {iconOnly ? (
        copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      ) : copied ? (
        'Copied'
      ) : (
        label
      )}
    </Button>
  );
}
