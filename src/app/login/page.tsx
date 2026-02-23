import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { auth } from '@/lib/auth/session';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="ui-label">LiveCardStudio.com</p>
          <h1 className="section-title mt-4 text-6xl leading-[0.95]">Send something unforgettable</h1>
          <p className="serif-copy mt-5 max-w-xl text-2xl text-brand-body">
            Create immersive, interactive greeting cards that feel handcrafted for one person.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
