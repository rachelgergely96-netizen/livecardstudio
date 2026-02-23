import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function auth() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }

    console.error('Failed to resolve server session.', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
