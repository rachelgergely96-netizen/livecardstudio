export default function FaqPage() {
  const faqs = [
    {
      q: 'How long does it take to create a card?',
      a: 'Most quick cards take under 2 minutes. Premium cards usually take 5-10 minutes depending on photos and message edits.'
    },
    {
      q: 'Do recipients need to install an app?',
      a: 'No. Cards open from a single link in any modern mobile or desktop browser.'
    },
    {
      q: 'Can I use premium themes on the Free plan?',
      a: 'Free accounts can create quick cards. Premium themes and gift reveals require a Premium or Pro plan.'
    },
    {
      q: 'How are card views counted?',
      a: 'View counts are recorded from recipient visits with bot and prefetch filtering plus short dedupe windows to reduce inflated analytics.'
    },
    {
      q: 'Can I include a gift card in my card?',
      a: 'Yes, gift card reveals are available on Premium and Pro plans where supported.'
    },
    {
      q: 'Can I change a card after publishing?',
      a: 'Yes. Open the card in your studio, edit it, regenerate preview, and republish.'
    }
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-brand-charcoal">
      <p className="ui-label">LiveCardStudio</p>
      <h1 className="section-title mt-3 text-5xl">FAQ</h1>
      <p className="serif-copy mt-5 text-2xl text-brand-body">Answers to the most common creator and delivery questions.</p>

      <section className="mt-8 space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="card-panel p-5">
            <h2 className="section-title text-2xl">{item.q}</h2>
            <p className="mt-2 text-sm text-brand-body">{item.a}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
