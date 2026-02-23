import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CopyLinkButton } from '@/components/dashboard/copy-link-button';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { absoluteUrl } from '@/lib/utils';

export default async function SharePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/card/${params.slug}/share`);
  }

  const card = await prisma.card.findFirst({
    where: {
      slug: params.slug,
      userId: session.user.id
    },
    include: {
      giftCard: true,
      photos: {
        orderBy: { sortOrder: 'asc' },
        take: 1
      }
    }
  });

  if (!card) {
    redirect('/dashboard');
  }

  const shareUrl = absoluteUrl(`/c/${card.slug}`);
  const recipient = card.recipientName || 'there';
  const message = `I made you something special - turn your sound on. ${shareUrl}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
  const emailSubject = `Someone made you something beautiful`;
  const emailBody = `Hi ${recipient},\n\n${message}`;
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const thumb = card.photos[0]?.base64Data || card.photos[0]?.processedUrl || card.photos[0]?.originalUrl || '';

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <section className="card-panel relative overflow-hidden p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,121,65,0.24),transparent_42%),radial-gradient(circle_at_75%_85%,rgba(196,176,212,0.25),transparent_42%)]" />
        <div className="relative">
          <p className="ui-label">Card ready</p>
          <h1 className="section-title mt-2 text-5xl">Your card is ready to send</h1>
          <p className="serif-copy mt-3 text-2xl text-brand-body">Copy your link or send instantly through your favorite channel.</p>

          <div className="mt-7 rounded-2xl border border-[rgba(200,160,120,0.25)] bg-white/80 p-4">
            <p className="ui-label">Shareable link</p>
            <p className="mt-2 break-all text-lg text-brand-charcoal">{shareUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyLinkButton url={shareUrl} />
              <a href={smsUrl}><Button tone="secondary">Send via iMessage</Button></a>
              <a href={mailto}><Button tone="secondary">Send via Email</Button></a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"><Button tone="secondary">Send via WhatsApp</Button></a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[rgba(200,160,120,0.24)] bg-white/70">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="Card preview" className="h-44 w-full object-cover" />
              ) : (
                <div className="h-44 bg-[linear-gradient(135deg,#e9d6bd,#eadcf4)]" />
              )}
              <div className="p-3">
                <p className="ui-label">Link preview</p>
                <p className="section-title mt-1 text-2xl">Someone made you something beautiful, {card.recipientName}</p>
                <p className="mt-1 text-sm text-brand-muted">A living card crafted with love - tap to experience it.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(200,160,120,0.24)] bg-white/70 p-4">
              <p className="ui-label">Delivery tracking</p>
              <p className="serif-copy mt-2 text-2xl text-brand-body">
                We&apos;ll notify you when {card.recipientName} opens their card.
              </p>
              <label className="mt-4 flex items-center gap-2 text-sm text-brand-muted">
                <input type="checkbox" defaultChecked />
                Send me an email on first view
              </label>
              <div className="mt-6 flex gap-2">
                <Link href={`/c/${card.slug}`} target="_blank">
                  <Button tone="secondary">Open Recipient View</Button>
                </Link>
                <Link href="/dashboard">
                  <Button tone="secondary">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
