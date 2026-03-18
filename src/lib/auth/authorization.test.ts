import type { Session } from 'next-auth';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_ROLES,
  getDefaultAuthenticatedRoute,
  getLoginRedirect,
  getProtectedRouteOutcome,
  hasAnyRole,
} from './guards';

const managerSession = {
  expires: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'user_1',
    name: 'Morgan Manager',
    email: 'manager@trainovations.com',
    role: 'sales_manager',
  },
} as Session;

describe('authorization utilities', () => {
  it('accepts roles that are explicitly allowed', () => {
    expect(hasAnyRole('sales_manager', ADMIN_ROLES)).toBe(true);
    expect(hasAnyRole('sales_rep', ADMIN_ROLES)).toBe(false);
  });

  it('builds a login redirect with callback url', () => {
    expect(getLoginRedirect('/admin/reps')).toBe(
      '/login?callbackUrl=%2Fadmin%2Freps',
    );
  });

  it('maps authenticated roles to sensible default destinations', () => {
    expect(getDefaultAuthenticatedRoute()).toBe('/workspace');
    expect(getDefaultAuthenticatedRoute('sales_rep')).toBe('/workspace');
    expect(getDefaultAuthenticatedRoute('sales_manager')).toBe('/admin');
    expect(getDefaultAuthenticatedRoute('super_admin')).toBe('/admin');
  });

  it('redirects unauthenticated users', () => {
    expect(
      getProtectedRouteOutcome({ session: null, callbackUrl: '/admin' }),
    ).toEqual({
      status: 'redirect',
      location: '/login?callbackUrl=%2Fadmin',
    });
  });

  it('returns forbidden for authenticated users without the required role', () => {
    expect(
      getProtectedRouteOutcome({
        session: {
          expires: managerSession.expires,
          user: {
            ...managerSession.user,
            role: 'sales_rep',
          },
        } as Session,
        allowedRoles: ADMIN_ROLES,
      }),
    ).toEqual({
      status: 'forbidden',
    });
  });

  it('allows authenticated users with the required role', () => {
    expect(
      getProtectedRouteOutcome({
        session: managerSession,
        allowedRoles: ADMIN_ROLES,
      }),
    ).toEqual({
      status: 'allowed',
      user: managerSession.user,
    });
  });
});
