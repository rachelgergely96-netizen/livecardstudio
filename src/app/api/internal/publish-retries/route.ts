import { CardStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { regenerateCardHtml } from '@/lib/cards/publish';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

const MAX_RETRIES = 8;
const BASE_DELAY_MINUTES = 5;
const MAX_DELAY_MINUTES = 12 * 60;
const BATCH_SIZE = 20;

function nextRetryDelayMinutes(attemptNumber: number) {
  return Math.min(MAX_DELAY_MINUTES, BASE_DELAY_MINUTES * Math.pow(2, Math.max(0, attemptNumber - 1)));
}

function getAuthToken(request: Request) {
  const headerToken = request.headers.get('x-publish-retry-secret');
  if (headerToken) {
    return headerToken;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    if (!env.PUBLISH_RETRY_SECRET) {
      return NextResponse.json({ error: 'PUBLISH_RETRY_SECRET is not configured' }, { status: 400 });
    }

    const token = getAuthToken(request);
    if (!token || token !== env.PUBLISH_RETRY_SECRET) {
      return unauthorized();
    }

    const now = new Date();
    const cards = await prisma.card.findMany({
      where: {
        status: CardStatus.PAID,
        publishRetryAt: {
          lte: now
        },
        publishRetryCount: {
          lt: MAX_RETRIES
        }
      },
      orderBy: {
        publishRetryAt: 'asc'
      },
      take: BATCH_SIZE
    });

    if (!cards.length) {
      return NextResponse.json({
        attempted: 0,
        published: 0,
        failed: 0
      });
    }

    const results: Array<{ cardId: string; status: 'published' | 'failed'; error?: string }> = [];

    for (const card of cards) {
      try {
        await regenerateCardHtml(card.id, {
          status: CardStatus.PUBLISHED,
          markPublishedAt: true
        });
        results.push({
          cardId: card.id,
          status: 'published'
        });
      } catch (error) {
        const retryCount = card.publishRetryCount + 1;
        const fatal = retryCount >= MAX_RETRIES;
        const message = error instanceof Error ? error.message : String(error);

        await prisma.card.update({
          where: { id: card.id },
          data: {
            status: CardStatus.PAID,
            publishRetryCount: retryCount,
            publishRetryAt: fatal
              ? null
              : new Date(Date.now() + nextRetryDelayMinutes(retryCount) * 60 * 1000),
            publishError: message.slice(0, 1000)
          }
        });

        results.push({
          cardId: card.id,
          status: 'failed',
          error: message
        });
      }
    }

    return NextResponse.json({
      attempted: results.length,
      published: results.filter((result) => result.status === 'published').length,
      failed: results.filter((result) => result.status === 'failed').length,
      results
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Retry worker failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
