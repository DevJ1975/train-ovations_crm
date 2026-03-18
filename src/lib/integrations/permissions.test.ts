import { describe, expect, it } from 'vitest';

import { canAccessIntegrationSettings } from './permissions';

describe('integration permissions', () => {
  it('allows authenticated CRM roles into integration settings', () => {
    expect(canAccessIntegrationSettings('super_admin')).toBe(true);
    expect(canAccessIntegrationSettings('sales_manager')).toBe(true);
    expect(canAccessIntegrationSettings('sales_rep')).toBe(true);
  });

  it('denies missing roles', () => {
    expect(canAccessIntegrationSettings(undefined)).toBe(false);
  });
});
