import { z } from 'zod';
import { ok, serverError } from '@/lib/api';
import { issuePasswordResetToken } from '@/lib/auth/password-reset';
import { prisma } from '@/lib/db/prisma';
import { buildPasswordResetEmail, sendEmail } from '@/lib/integrations/email';

const requestResetSchema = z.object({
  email: z.string().email()
});

const GENERIC_RESPONSE = {
  success: true,
  message: 'If that email is in our system, a reset link has been sent.'
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestResetSchema.safeParse(body);

    if (!parsed.success) {
      return ok(GENERIC_RESPONSE);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      return ok(GENERIC_RESPONSE);
    }

    const issued = await issuePasswordResetToken(user.id, user.email);
    const emailPayload = buildPasswordResetEmail({ resetUrl: issued.resetUrl });

    await sendEmail({
      to: user.email,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    });

    return ok(GENERIC_RESPONSE);
  } catch (error) {
    return serverError(error);
  }
}
