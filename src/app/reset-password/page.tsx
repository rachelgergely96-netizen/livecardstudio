import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: { email?: string; token?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="ui-label">LiveCardStudio.com</p>
          <h1 className="section-title mt-4 text-6xl leading-[0.95]">Securely update your password</h1>
          <p className="serif-copy mt-5 max-w-xl text-2xl text-brand-body">
            This reset link is single-use and time-limited for account security.
          </p>
        </div>
        <ResetPasswordForm email={searchParams?.email} token={searchParams?.token} />
      </div>
    </main>
  );
}
