import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { getProposalByToken, recordProposalView } from '@/lib/services/proposal-engine-service';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;

  const proposal = await getProposalByToken(token);
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check expiry
  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This proposal has expired', status: 'expired' }, { status: 410 });
  }

  // Record view asynchronously (don't await, don't block)
  void recordProposalView(token).catch(() => {});

  return NextResponse.json({ proposal });
}
