import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { absoluteUrl } from '@/lib/utils';

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createPasswordResetUrl(input: { email: string; token: string }) {
  const params = new URLSearchParams({
    email: input.email,
    token: input.token
  });
  return absoluteUrl(`/reset-password?${params.toString()}`);
}

export async function issuePasswordResetToken(userId: string, email: string) {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    rawToken,
    resetUrl: createPasswordResetUrl({ email, token: rawToken }),
    expiresAt
  };
}

export async function consumePasswordResetToken(input: {
  email: string;
  token: string;
  newPassword: string;
}) {
  const tokenHash = hashToken(input.token);
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });

  if (!user) {
    return false;
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!resetToken) {
    return false;
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now }
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        id: { not: resetToken.id }
      },
      data: { usedAt: now }
    })
  ]);

  return true;
}

export async function cleanupExpiredPasswordResetTokens() {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }]
    }
  });
}
