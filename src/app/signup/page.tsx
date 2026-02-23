import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { normalizeCallbackUrl } from '@/lib/auth/callback-url';
import { auth } from '@/lib/auth/session';

export default async function SignupPage({
  searchParams
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = normalizeCallbackUrl(searchParams.callbackUrl, '/dashboard');
  const session = await auth();
  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="ui-label">LiveCardStudio.com</p>
          <h1 className="section-title mt-4 text-6xl leading-[0.95]">Build your first living card</h1>
          <p className="serif-copy mt-5 max-w-xl text-2xl text-brand-body">
            Moments deserve more than flat templates. Start your studio and craft something that moves.
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
