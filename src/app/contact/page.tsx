import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-brand-charcoal">
      <p className="ui-label">LiveCardStudio</p>
      <h1 className="section-title mt-3 text-5xl">Contact</h1>

      <section className="mt-6 space-y-4">
        <article className="card-panel p-5">
          <h2 className="section-title text-2xl">General support</h2>
          <p className="mt-2 text-sm text-brand-body">
            Email us at <a href="mailto:support@livecardstudio.com" className="text-brand-copper">support@livecardstudio.com</a>.
          </p>
          <p className="mt-2 text-sm text-brand-muted">Typical response window: within 1-2 business days.</p>
        </article>

        <article className="card-panel p-5">
          <h2 className="section-title text-2xl">Billing and account</h2>
          <p className="mt-2 text-sm text-brand-body">
            For subscription, checkout, or plan issues, contact{' '}
            <a href="mailto:billing@livecardstudio.com" className="text-brand-copper">billing@livecardstudio.com</a>.
          </p>
        </article>

        <article className="card-panel p-5">
          <h2 className="section-title text-2xl">Legal and privacy</h2>
          <p className="mt-2 text-sm text-brand-body">
            Legal requests can be sent to <a href="mailto:legal@livecardstudio.com" className="text-brand-copper">legal@livecardstudio.com</a>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/privacy" className="text-sm text-brand-copper">Privacy policy</Link>
            <Link href="/terms" className="text-sm text-brand-copper">Terms</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
