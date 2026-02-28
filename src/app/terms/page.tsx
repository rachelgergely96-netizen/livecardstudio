export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-brand-charcoal">
      <p className="ui-label">LiveCardStudio</p>
      <h1 className="section-title mt-3 text-5xl">Terms</h1>

      <div className="mt-6 space-y-4 text-sm text-brand-body">
        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Service use</h2>
          <p className="mt-2">
            You may use LiveCardStudio only for lawful purposes and may not upload harmful, infringing, or abusive
            content.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Accounts and security</h2>
          <p className="mt-2">
            You are responsible for account credentials and activities performed under your account.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Billing</h2>
          <p className="mt-2">
            Paid features, plan upgrades, and checkout charges are billed through our payment processors and may change
            with prior notice.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Content ownership</h2>
          <p className="mt-2">
            You retain ownership of content you upload. You grant us a limited license to host, process, and deliver
            your cards.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Contact</h2>
          <p className="mt-2">
            For terms-related questions, contact <a href="mailto:legal@livecardstudio.com" className="text-brand-copper">legal@livecardstudio.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
