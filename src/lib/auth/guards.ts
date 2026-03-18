import type { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';

const ADMIN_ROLES: UserRole[] = ['super_admin', 'sales_manager'];

export function getDefaultAuthenticatedRoute(userRole?: UserRole) {
  if (!userRole) {
    return '/workspace';
  }

  if (userRole === 'sales_rep') {
    return '/workspace';
  }

  return '/admin';
}

export function hasAnyRole(
  userRole: UserRole | undefined,
  allowedRoles: readonly UserRole[],
) {
  return !!userRole && allowedRoles.includes(userRole);
}

export function getLoginRedirect(callbackUrl = '/admin') {
  const params = new URLSearchParams({ callbackUrl });
  return `/login?${params.toString()}`;
}

export function getProtectedRouteOutcome({
  session,
  allowedRoles,
  callbackUrl = '/admin',
}: {
  session: Session | null;
  allowedRoles?: readonly UserRole[];
  callbackUrl?: string;
}) {
  if (!session?.user) {
    return {
      status: 'redirect' as const,
      location: getLoginRedirect(callbackUrl),
    };
  }

  if (allowedRoles && !hasAnyRole(session.user.role, allowedRoles)) {
    return {
      status: 'forbidden' as const,
    };
  }

  if (session.user.mustChangePassword && callbackUrl !== '/change-password') {
    return {
      status: 'redirect' as const,
      location: '/change-password',
    };
  }

  return {
    status: 'allowed' as const,
    user: session.user,
  };
}

export { ADMIN_ROLES };
