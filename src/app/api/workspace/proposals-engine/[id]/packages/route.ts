import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { addPackage, updatePackage, deletePackage } from '@/lib/services/proposal-engine-service';
import { createPackageSchema, updatePackageSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = createPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const pkg = await addPackage(user.id, id, parsed.data);
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg.includes('not found') ? 404 : 500 });
  }
}
