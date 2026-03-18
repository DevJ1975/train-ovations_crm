import { NextResponse } from 'next/server';

import { clientSignProposal } from '@/lib/services/proposal-engine-service';
import { clientSignSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ token: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = clientSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const proposal = await clientSignProposal(token, parsed.data);
    return NextResponse.json({ success: true, status: proposal.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 400 });
  }
}
