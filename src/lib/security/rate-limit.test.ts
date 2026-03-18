import { describe, expect, it } from 'vitest';

import { checkRateLimit, resetRateLimitStore } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows requests until the bucket is full and then blocks', () => {
    resetRateLimitStore();

    expect(
      checkRateLimit('lead:test', { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(true);
    expect(
      checkRateLimit('lead:test', { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(true);
    expect(
      checkRateLimit('lead:test', { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(false);
  });
});
