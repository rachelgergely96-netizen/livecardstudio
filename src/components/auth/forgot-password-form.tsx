'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ForgotPasswordForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not submit password reset request.');
      }

      setStatus(payload.message || 'If your email exists, we sent a reset link.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit password reset request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-panel mx-auto w-full max-w-md p-7">
      <p className="ui-label">Account recovery</p>
      <h1 className="section-title mt-2 text-4xl">Reset your password</h1>
      <p className="mt-3 text-sm text-brand-muted">
        Enter the email on your account and we will send you a reset link.
      </p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="ui-label">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-brand-muted">
        Remembered it? <Link href="/login" className="text-brand-copper">Back to login</Link>
      </p>
      {status ? <p className="mt-3 text-sm text-brand-copper">{status}</p> : null}
    </div>
  );
}
