import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { created, badRequest, serverError } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  termsAccepted: z.literal(true)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Invalid registration payload', parsed.error.flatten());
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return badRequest('An account with that email already exists.');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true
      }
    });

    return created({ user });
  } catch (error) {
    return serverError(error);
  }
}
