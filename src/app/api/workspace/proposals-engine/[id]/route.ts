import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  getProposalEngine,
  updateProposalMeta,
  deleteProposalEngine,
} from '@/lib/services/proposal-engine-service';
import { updateProposalMetaSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const proposal = await getProposalEngine(user.id, id);
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ proposal });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateProposalMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const proposal = await updateProposalMeta(user.id, id, parsed.data);
    return NextResponse.json({ proposal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg.includes('not found')) return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  try {
    await deleteProposalEngine(user.id, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg.includes('not found')) return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
