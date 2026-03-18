import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

import { auth } from '../../../auth';
import { ADMIN_ROLES, getProtectedRouteOutcome } from './guards';

export async function requireAuthenticatedUser(callbackUrl?: string) {
  const session = await auth();
  const outcome = getProtectedRouteOutcome({ session, callbackUrl });

  if (outcome.status === 'redirect') {
    redirect(outcome.location);
  }

  if (outcome.status !== 'allowed') {
    redirect('/login');
  }

  return outcome.user;
}

export async function requireRole(
  allowedRoles: readonly UserRole[],
  callbackUrl?: string,
) {
  const session = await auth();
  const outcome = getProtectedRouteOutcome({
    session,
    allowedRoles,
    callbackUrl,
  });

  if (outcome.status === 'redirect') {
    redirect(outcome.location);
  }

  if (outcome.status === 'forbidden') {
    redirect('/admin/unauthorized');
  }

  if (outcome.status !== 'allowed') {
    redirect('/login');
  }

  return outcome.user;
}

export async function requireAdminUser(callbackUrl?: string) {
  return requireRole(ADMIN_ROLES, callbackUrl);
}
