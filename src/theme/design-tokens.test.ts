import { describe, expect, it } from 'vitest';

import { designTokens } from './design-tokens';

describe('designTokens', () => {
  it('exposes the core Trainovations token categories', () => {
    expect(designTokens.colors.primary).toBe('#0B5FFF');
    expect(designTokens.typography.hero[0]).toBe('3rem');
    expect(designTokens.radius.lg).toBe('1rem');
  });
});
