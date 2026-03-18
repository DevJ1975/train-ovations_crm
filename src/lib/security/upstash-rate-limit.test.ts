import { describe, expect, it, vi } from 'vitest';

import * as localRateLimit from './rate-limit';
import { limitPublicRequest } from './upstash-rate-limit';

describe('limitPublicRequest', () => {
  it('falls back to the local limiter when Upstash is not configured', async () => {
    const fallbackSpy = vi.spyOn(localRateLimit, 'checkRateLimit');

    const result = await limitPublicRequest({
      key: 'public:test',
      limit: 3,
      window: '1 m',
      windowMsFallback: 60_000,
    });

    expect(fallbackSpy).toHaveBeenCalled();
    expect(result.allowed).toBe(true);
  });
});
