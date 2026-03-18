import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  applyRateLimitHeaders,
  limitPublicRequest,
} from '@/lib/security/upstash-rate-limit';
import { createLeadFromPublicLandingPage } from '@/lib/services';

function getClientAddress(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  );
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: 'Invalid request payload.' },
      { status: 400 },
    );
  }

  const key = `${getClientAddress(request)}:${String(payload.repSlug ?? 'unknown')}`;
  const rateLimit = await limitPublicRequest({
    limit: 5,
    window: '1 m',
    windowMsFallback: 60_000,
    key,
  });

  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { ok: false, message: 'Too many submissions. Please try again shortly.' },
        { status: 429 },
      ),
      rateLimit,
    );
  }

  try {
    const result = await createLeadFromPublicLandingPage(payload as never);

    if (result.outcome === 'spam') {
      return applyRateLimitHeaders(
        NextResponse.json(
          { ok: true, accepted: true, message: 'Submission received.' },
          { status: 202 },
        ),
        rateLimit,
      );
    }

    if (result.outcome === 'not_found') {
      return applyRateLimitHeaders(
        NextResponse.json(
          { ok: false, message: 'Rep not found.' },
          { status: 404 },
        ),
        rateLimit,
      );
    }

    return applyRateLimitHeaders(
      NextResponse.json(
        {
          ok: true,
          leadId: result.lead.id,
          status: result.lead.status,
          duplicateOfLeadId: result.lead.duplicateOfLeadId ?? null,
        },
        { status: 201 },
      ),
      rateLimit,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            ok: false,
            message: 'Please review the form fields and try again.',
            fieldErrors: error.flatten().fieldErrors,
          },
          { status: 400 },
        ),
        rateLimit,
      );
    }

    return applyRateLimitHeaders(
      NextResponse.json(
        { ok: false, message: 'Please review the form fields and try again.' },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
