import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { trackProposalEvent } from '@/lib/services/proposal-engine-service';
import { proposalEventSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ token: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = proposalEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const headerMap = await headers();
  const ipAddress = headerMap.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = headerMap.get('user-agent') ?? null;

  await trackProposalEvent(token, parsed.data, { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined });
  return NextResponse.json({ success: true });
}
