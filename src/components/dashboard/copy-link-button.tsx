'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" tone="secondary" className="px-3 py-2 text-xs" onClick={handleCopy}>
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}
