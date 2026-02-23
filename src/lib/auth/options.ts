import { createHash } from 'node:crypto';
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

const authSecret =
  env.NEXTAUTH_SECRET ||
  createHash('sha256')
    .update(`${env.DATABASE_URL || 'livecardstudio'}:${env.NEXTAUTH_URL || 'https://livecardstudio.com'}`)
    .digest('hex');

if (!env.NEXTAUTH_SECRET) {
  console.warn('NEXTAUTH_SECRET is missing. Using deterministic fallback secret. Configure NEXTAUTH_SECRET in production.');
}

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

      try {
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
      } catch (error) {
        console.error('Credentials authorize failed.', error);
        return null;
      }
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
  secret: authSecret,
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
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
          if (dbUser) {
            token.id = dbUser.id;
            token.plan = dbUser.plan;
          }
        } catch (error) {
          console.error('JWT callback user lookup failed.', error);
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
