import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';

import { checkRateLimit } from './rate-limit';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit?: number;
  reset?: number;
  pending?: Promise<unknown>;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
  windowMsFallback: number;
};

function getUpstashRedisConfig() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export async function limitPublicRequest(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redisConfig = getUpstashRedisConfig();

  if (!redisConfig) {
    return checkRateLimit(options.key, {
      limit: options.limit,
      windowMs: options.windowMsFallback,
    });
  }

  const ratelimit = new Ratelimit({
    redis: {
      async limit() {
        throw new Error('Custom Redis client not configured for Stage 1');
      },
    } as never,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    analytics: false,
    prefix: 'trainovations',
  });

  try {
    const result = await ratelimit.limit(options.key);

    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
      pending: result.pending,
    };
  } catch {
    return checkRateLimit(options.key, {
      limit: options.limit,
      windowMs: options.windowMsFallback,
    });
  }
}

export function applyRateLimitHeaders(
  response: NextResponse,
  rateLimit: RateLimitResult,
) {
  if (typeof rateLimit.limit === 'number') {
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  }

  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));

  if (typeof rateLimit.reset === 'number') {
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));
  }

  return response;
}
