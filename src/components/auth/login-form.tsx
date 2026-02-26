'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeCallbackUrl } from '@/lib/auth/callback-url';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = normalizeCallbackUrl(searchParams.get('callbackUrl'), '/dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      setStatus('Could not sign in. Check your email and password.');
      return;
    }

    router.push(result?.url || callbackUrl);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setStatus('');
    await signIn('google', { callbackUrl });
  }

  return (
    <div className="card-panel mx-auto w-full max-w-md p-7">
      <p className="ui-label">Welcome back</p>
      <h1 className="section-title mt-2 text-4xl">Open your studio</h1>

      <form className="mt-6 space-y-3" onSubmit={handlePasswordLogin}>
        <div>
          <label className="ui-label">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div>
          <label className="ui-label">Password</label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>

        <div className="flex justify-end">
          <Link
            href={{
              pathname: '/forgot-password',
              query: email ? { email } : undefined
            }}
            className="text-xs text-brand-copper"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        <Button type="button" tone="secondary" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
          Continue with Google
        </Button>
      </div>

      <p className="mt-5 text-sm text-brand-muted">
        No account?{' '}
        <Link
          href={{
            pathname: '/signup',
            query: { callbackUrl }
          }}
          className="text-brand-copper"
        >
          Create one
        </Link>
      </p>
      {status ? <p className="mt-3 text-sm text-brand-copper">{status}</p> : null}
    </div>
  );
}
