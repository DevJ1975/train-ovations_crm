import { describe, expect, it } from 'vitest';

import { credentialsSchema } from './schema';

describe('credentialsSchema', () => {
  it('accepts a valid login payload', () => {
    const result = credentialsSchema.safeParse({
      email: 'admin@trainovations.com',
      password: 'Trainovations123!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects malformed login payloads', () => {
    const result = credentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });
});
