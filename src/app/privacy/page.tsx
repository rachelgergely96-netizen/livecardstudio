export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-brand-charcoal">
      <p className="ui-label">LiveCardStudio</p>
      <h1 className="section-title mt-3 text-5xl">Privacy Policy</h1>

      <div className="mt-6 space-y-4 text-sm text-brand-body">
        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Information we collect</h2>
          <p className="mt-2">
            We collect account details (name, email), card content you provide (messages, photos, audio), and usage data
            needed to operate the service.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">How we use information</h2>
          <p className="mt-2">
            We use your data to deliver cards, support checkout and gift integrations, prevent abuse, and improve
            product reliability and analytics.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Processors and partners</h2>
          <p className="mt-2">
            We use third-party providers including Stripe (payments), Tremendous (gift cards), Resend (email), and cloud
            storage vendors for hosting card media.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Data retention</h2>
          <p className="mt-2">
            Card content is retained while your account is active or as needed for legal and accounting obligations.
            You can request deletion through support.
          </p>
        </section>

        <section className="card-panel p-5">
          <h2 className="section-title text-2xl">Contact</h2>
          <p className="mt-2">
            For privacy requests, email <a href="mailto:privacy@livecardstudio.com" className="text-brand-copper">privacy@livecardstudio.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
