import { NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const note = await db.repNote.findFirst({
    where: { id, repProfileId: repProfile.id },
    select: { id: true },
  });
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  await db.repNote.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
