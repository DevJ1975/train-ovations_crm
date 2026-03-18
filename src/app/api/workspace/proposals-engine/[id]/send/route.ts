import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { sendProposal } from '@/lib/services/proposal-engine-service';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  try {
    const proposal = await sendProposal(user.id, id);
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposal/${proposal?.shareToken}`;
    return NextResponse.json({ proposal, shareUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg.includes('not found')) return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
