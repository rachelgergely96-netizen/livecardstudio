import { Plan } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    plan: Plan;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    plan?: Plan;
  }
}
