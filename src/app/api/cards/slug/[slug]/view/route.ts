import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { buildFirstViewOpenedEmail, sendEmail } from '@/lib/integrations/email';
import { absoluteUrl } from '@/lib/utils';

export const runtime = 'nodejs';

const VIEW_COOKIE_TTL_SECONDS = 6 * 60 * 60;

function isLikelyBot(userAgent: string) {
  return /(bot|crawler|spider|slurp|facebookexternalhit|whatsapp|discordbot|linkedinbot|twitterbot|slackbot)/i.test(
    userAgent
  );
}

function isLikelyPrefetch(request: Request) {
  const purpose =
    request.headers.get('purpose') ||
    request.headers.get('x-purpose') ||
    request.headers.get('sec-purpose') ||
    '';
  return /(prefetch|preview|prerender)/i.test(purpose);
}

export async function POST(request: Request, context: { params: { slug: string } }) {
  try {
    if (!request.headers.get('x-lcs-view-track')) {
      return NextResponse.json({ tracked: false, reason: 'missing_tracking_header' });
    }

    const userAgent = request.headers.get('user-agent') || '';
    if (isLikelyBot(userAgent) || isLikelyPrefetch(request)) {
      return NextResponse.json({ tracked: false, reason: 'bot_or_prefetch' });
    }

    const card = await prisma.card.findUnique({
      where: { slug: context.params.slug },
      select: {
        id: true,
        slug: true,
        recipientName: true,
        notifyOnFirstView: true,
        notifyEmail: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!card) {
      return NextResponse.json({ tracked: false, reason: 'card_not_found' }, { status: 404 });
    }

    const cookieName = `lcs_view_${card.id}`;
    const hasCookie = request.headers.get('cookie')?.includes(`${cookieName}=`) || false;
    if (hasCookie) {
      return NextResponse.json({ tracked: false, reason: 'deduped' });
    }

    const viewedAt = new Date();
    const firstViewResult = await prisma.card.updateMany({
      where: {
        id: card.id,
        firstViewedAt: null
      },
      data: {
        firstViewedAt: viewedAt
      }
    });

    await prisma.card.update({
      where: { id: card.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    if (firstViewResult.count > 0 && card.notifyOnFirstView) {
      const targetEmail = card.notifyEmail || card.user.email;
      if (targetEmail) {
        const payload = buildFirstViewOpenedEmail({
          recipientName: card.recipientName,
          viewedAtIso: viewedAt.toISOString(),
          statsUrl: absoluteUrl(`/card/${card.slug}/share`)
        });

        try {
          await sendEmail({
            to: targetEmail,
            subject: payload.subject,
            html: payload.html,
            text: payload.text
          });
        } catch (error) {
          console.error('Failed to send first-view notification email', {
            cardId: card.id,
            slug: card.slug,
            error
          });
        }
      }
    }

    const response = NextResponse.json({ tracked: true });
    response.cookies.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: VIEW_COOKIE_TTL_SECONDS,
      path: `/c/${card.slug}`
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ tracked: false, error: 'tracking_failed' }, { status: 500 });
  }
}
