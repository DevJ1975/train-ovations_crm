import { NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getRepLeadActivityTimeline } from '@/lib/services';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id: leadId } = await ctx.params;

  const entries = await getRepLeadActivityTimeline(auth.id, leadId);

  return NextResponse.json({
    items: entries.map((e) => ({
      id: e.id,
      type: e.type,
      description: e.description,
      entityType: 'lead',
      entityId: leadId,
      repProfileId: e.repProfileId,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
