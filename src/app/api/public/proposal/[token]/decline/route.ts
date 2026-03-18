import { NextResponse } from 'next/server';
import { z } from 'zod';

import { clientDeclineProposal } from '@/lib/services/proposal-engine-service';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ token: string }> };

const schema = z.object({ reason: z.string().max(500).optional() });

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const { reason } = schema.parse(body);

  try {
    await clientDeclineProposal(token, reason);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 400 });
  }
}
