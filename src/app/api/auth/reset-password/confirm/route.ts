import { z } from 'zod';
import { badRequest, ok, serverError } from '@/lib/api';
import { consumePasswordResetToken } from '@/lib/auth/password-reset';

const confirmResetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmResetSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Invalid password reset payload.', parsed.error.flatten());
    }

    const succeeded = await consumePasswordResetToken({
      email: parsed.data.email.trim().toLowerCase(),
      token: parsed.data.token,
      newPassword: parsed.data.password
    });

    if (!succeeded) {
      return badRequest('Reset link is invalid or expired. Request a new link.');
    }

    return ok({
      success: true,
      message: 'Password updated. You can now sign in.'
    });
  } catch (error) {
    return serverError(error);
  }
}
