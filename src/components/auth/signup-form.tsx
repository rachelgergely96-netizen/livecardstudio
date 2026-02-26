'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeCallbackUrl } from '@/lib/auth/callback-url';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = normalizeCallbackUrl(searchParams.get('callbackUrl'), '/dashboard');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!termsAccepted) {
      setStatus('Please accept the terms to continue.');
      return;
    }

    setLoading(true);
    setStatus('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, termsAccepted })
    });

    const payload = await response.json();

    if (!response.ok) {
      setLoading(false);
      setStatus(payload.error || 'Could not create account.');
      return;
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (signInResult?.error) {
      setStatus('Account created. Please sign in.');
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    router.push(signInResult?.url || callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setStatus('');
    await signIn('google', { callbackUrl });
  }

  return (
    <div className="card-panel mx-auto w-full max-w-md p-7">
      <p className="ui-label">Create account</p>
      <h1 className="section-title mt-2 text-4xl">Start your studio</h1>

      <form className="mt-6 space-y-3" onSubmit={handleSignup}>
        <div>
          <label className="ui-label">Name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>

        <div>
          <label className="ui-label">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div>
          <label className="ui-label">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <label className="mt-2 flex items-start gap-2 text-sm text-brand-muted">
          <input
            className="mt-1"
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          I accept the terms and privacy policy.
        </label>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <Button type="button" tone="secondary" className="mt-4 w-full" onClick={handleGoogleSignup} disabled={loading}>
        Continue with Google
      </Button>

      <p className="mt-5 text-sm text-brand-muted">
        Already have an account?{' '}
        <Link
          href={{
            pathname: '/login',
            query: { callbackUrl }
          }}
          className="text-brand-copper"
        >
          Sign in
        </Link>
      </p>
      {status ? <p className="mt-3 text-sm text-brand-copper">{status}</p> : null}
    </div>
  );
}
