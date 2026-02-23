'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  cardId: string;
  initialNotifyOnFirstView: boolean;
  initialNotifyEmail: string | null;
  fallbackEmail: string | null;
};

export function FirstViewNotificationSettings({
  cardId,
  initialNotifyOnFirstView,
  initialNotifyEmail,
  fallbackEmail
}: Props) {
  const [notifyOnFirstView, setNotifyOnFirstView] = useState(initialNotifyOnFirstView);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail || fallbackEmail || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const payload = {
      notifyOnFirstView,
      notifyEmail: notifyEmail.trim() ? notifyEmail.trim() : null
    };

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not update notification settings.');
      }

      setStatus('Notification settings saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update notification settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-4" onSubmit={onSubmit}>
      <label className="flex items-center gap-2 text-sm text-brand-muted">
        <input
          type="checkbox"
          checked={notifyOnFirstView}
          onChange={(event) => setNotifyOnFirstView(event.target.checked)}
        />
        Send me an email on first view
      </label>

      <div className="mt-3">
        <label className="ui-label">Notification email</label>
        <Input
          type="email"
          value={notifyEmail}
          onChange={(event) => setNotifyEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" tone="secondary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>

      {status ? <p className="mt-2 text-sm text-brand-copper">{status}</p> : null}
    </form>
  );
}
