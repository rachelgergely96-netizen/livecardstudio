import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function auth() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
