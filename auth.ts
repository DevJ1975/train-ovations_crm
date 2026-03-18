import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { getPrismaClient } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { credentialsSchema } from '@/lib/auth/schema';
import {
  buildSessionUser,
  buildTokenUser,
  type TokenUserData,
} from '@/lib/auth/session';
import { upsertConnectedAccount } from '@/lib/integrations';
import { ConnectedProvider } from '@prisma/client';

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'development'
    ? 'trainovations-crm-dev-secret'
    : undefined);

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        const prisma = getPrismaClient();

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastLoginAt: new Date(),
          },
        });

        return buildTokenUser(user);
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'openid email profile',
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google' || !user.email) {
        return true;
      }

      const prisma = getPrismaClient();
      const normalizedEmail = user.email.toLowerCase();
      let dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!dbUser) {
        const isTrainovationsDomain = normalizedEmail.endsWith('@trainovations.com');

        if (!isTrainovationsDomain) {
          return false;
        }

        dbUser = await prisma.user.create({
          data: {
            name: user.name ?? normalizedEmail,
            email: normalizedEmail,
            imageUrl: user.image ?? undefined,
            role: 'sales_rep',
            isActive: true,
            mustChangePassword: false,
            lastLoginAt: new Date(),
          },
        });
      }

      if (!dbUser.isActive) {
        return false;
      }

      await upsertConnectedAccount({
        userId: dbUser.id,
        provider: ConnectedProvider.google_auth,
        providerAccountId: account.providerAccountId,
        accountEmail: normalizedEmail,
        displayName: user.name ?? dbUser.name,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        tokenType: account.token_type,
        scopes: account.scope?.split(' ') ?? ['openid', 'email', 'profile'],
        accessTokenExpiresAt: account.expires_at
          ? new Date(account.expires_at * 1000)
          : undefined,
        providerMetadata: {
          profileSub: profile?.sub,
        },
      });

      await prisma.user.update({
        where: {
          id: dbUser.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const prisma = getPrismaClient();
      const tokenUserData = token.user as { email?: string } | undefined;
      const emailToLookup =
        user?.email?.toLowerCase() ?? tokenUserData?.email?.toLowerCase();

      if (emailToLookup) {
        const dbUser = await prisma.user.findUnique({
          where: { email: emailToLookup },
        });

        token.user = dbUser ? buildTokenUser(dbUser) : user ? buildTokenUser(user) : token.user;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = buildSessionUser(
          token.user as TokenUserData,
        ) as typeof session.user;
      }

      return session;
    },
  },
});
