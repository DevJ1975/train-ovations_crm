import type { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';

export interface SessionUserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export type TokenUserData = SessionUserData;

interface UserLike {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  mustChangePassword?: boolean | null;
}

export function buildTokenUser(user: UserLike): TokenUserData {
  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

export function buildSessionUser(user: TokenUserData): Session['user'] {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}
