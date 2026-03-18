import { NextResponse } from 'next/server';
import { ProposalStatus } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const db = getPrismaClient();

  const proposal = await db.proposal.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true, signedAt: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (proposal.signedAt || proposal.status === ProposalStatus.signed) {
    return NextResponse.json({ error: 'Proposal has already been signed' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { signerName, signerEmail, signatureData } = body;

  if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
    return NextResponse.json({ error: 'signerName is required' }, { status: 400 });
  }
  if (!signerEmail || typeof signerEmail !== 'string' || !signerEmail.trim()) {
    return NextResponse.json({ error: 'signerEmail is required' }, { status: 400 });
  }
  if (!signatureData || typeof signatureData !== 'string') {
    return NextResponse.json({ error: 'signatureData is required' }, { status: 400 });
  }

  await db.proposal.update({
    where: { id: proposal.id },
    data: {
      signatureData: signatureData as string,
      signerName: signerName as string,
      signerEmail: signerEmail as string,
      signedAt: new Date(),
      status: ProposalStatus.signed,
    },
  });

  return NextResponse.json({ success: true });
}
