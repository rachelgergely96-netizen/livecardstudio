'use client';

import { useEffect } from 'react';

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/cards/slug/${encodeURIComponent(slug)}/view`, {
        method: 'POST',
        headers: {
          'x-lcs-view-track': '1'
        },
        credentials: 'include',
        keepalive: true
      }).catch(() => {
        // Non-fatal telemetry call.
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [slug]);

  return null;
}

