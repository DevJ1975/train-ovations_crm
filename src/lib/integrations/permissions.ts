import type { UserRole } from '@prisma/client';

export function canAccessIntegrationSettings(role: UserRole | undefined) {
  return role === 'super_admin' || role === 'sales_manager' || role === 'sales_rep';
}
