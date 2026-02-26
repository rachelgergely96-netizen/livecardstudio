'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ResetPasswordForm({ email, token }: { email?: string; token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    if (!email || !token) {
      setStatus('Reset link is invalid. Request a new link.');
      return;
    }

    if (password.length < 8) {
      setStatus('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Could not reset password.');
      }

      setSuccess(true);
      setStatus(payload.message || 'Password updated. You can now sign in.');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-panel mx-auto w-full max-w-md p-7">
      <p className="ui-label">Account recovery</p>
      <h1 className="section-title mt-2 text-4xl">Set a new password</h1>
      <p className="mt-3 text-sm text-brand-muted">Choose a new password for your LiveCardStudio account.</p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="ui-label">Email</label>
          <Input type="email" value={email || ''} disabled />
        </div>

        <div>
          <label className="ui-label">New password</label>
          <Input
            type="password"
            value={password}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="ui-label">Confirm password</label>
          <Input
            type="password"
            value={confirmPassword}
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading || success}>
          {loading ? 'Updating password...' : 'Update Password'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-brand-muted">
        Need a new link? <Link href="/forgot-password" className="text-brand-copper">Request reset email</Link>
      </p>

      {status ? <p className="mt-3 text-sm text-brand-copper">{status}</p> : null}
    </div>
  );
}
