import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { addBlock, updateBlock, deleteBlock, reorderBlocks } from '@/lib/services/proposal-engine-service';
import { createBlockSchema, updateBlockSchema, reorderBlocksSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const block = await addBlock(user.id, id, parsed.data);
    return NextResponse.json({ block }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  // Reorder request
  const reorderParsed = reorderBlocksSchema.safeParse(body);
  if (reorderParsed.success) {
    await reorderBlocks(user.id, id, reorderParsed.data.orderedIds);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
}
