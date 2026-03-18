import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { createProposalWithBlocks, listProposalsEngine } from '@/lib/services/proposal-engine-service';
import { createProposalSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const proposals = await listProposalsEngine(user.id);
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const proposal = await createProposalWithBlocks(user.id, parsed.data);
  return NextResponse.json({ proposal }, { status: 201 });
}
