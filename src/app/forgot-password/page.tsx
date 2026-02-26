import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage({
  searchParams
}: {
  searchParams?: { email?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="ui-label">LiveCardStudio.com</p>
          <h1 className="section-title mt-4 text-6xl leading-[0.95]">Get back into your studio</h1>
          <p className="serif-copy mt-5 max-w-xl text-2xl text-brand-body">
            We will send a secure password reset link so you can continue building your card.
          </p>
        </div>
        <ForgotPasswordForm initialEmail={searchParams?.email || ''} />
      </div>
    </main>
  );
}
