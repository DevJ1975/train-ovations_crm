const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const timestamps = buckets.get(key)?.filter((entry) => now - entry < windowMs) ?? [];

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return {
      allowed: false,
      remaining: 0,
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  return {
    allowed: true,
    remaining: limit - timestamps.length,
  };
}

export function resetRateLimitStore() {
  buckets.clear();
}
