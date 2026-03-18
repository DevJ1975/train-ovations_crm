import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getProposalAnalytics } from '@/lib/services/proposal-engine-service';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  try {
    const analytics = await getProposalAnalytics(user.id, id);
    return NextResponse.json(analytics);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 500 });
  }
}
