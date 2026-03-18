import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { updateBlock, deleteBlock } from '@/lib/services/proposal-engine-service';
import { updateBlockSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string; blockId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, blockId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const block = await updateBlock(user.id, id, blockId, parsed.data);
    return NextResponse.json({ block });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, blockId } = await ctx.params;
  try {
    await deleteBlock(user.id, id, blockId);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 500 });
  }
}
