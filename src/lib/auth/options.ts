import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { buildMagicLinkEmail, sendEmail } from '@/lib/integrations/email';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

const providers: AuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email and Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        return null;
      }

      const user = await prisma.user.findUnique({ where: { email: credentials.email } });
      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan
      };
    }
  })
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  );
}

providers.push(
  EmailProvider({
    from: env.RESEND_FROM_EMAIL || 'LiveCardStudio <hello@livecardstudio.com>',
    async sendVerificationRequest({ identifier, url }) {
      const email = buildMagicLinkEmail(url);
      await sendEmail({
        to: identifier,
        subject: email.subject,
        html: email.html,
        text: email.text
      });
    }
  })
);

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: Plan }).plan || 'FREE';
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.plan = dbUser.plan;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || '';
        session.user.plan = (token.plan as Plan) || 'FREE';
      }
      return session;
    }
  }
};
