import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const db = getPrismaClient();

  const proposal = await db.proposal.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      title: true,
      status: true,
      totalValueCents: true,
      executiveSummary: true,
      aboutUs: true,
      scopeOfWork: true,
      deliverables: true,
      timeline: true,
      pricing: true,
      terms: true,
      nextSteps: true,
      expiresAt: true,
      sentAt: true,
      signedAt: true,
      signerName: true,
      signerEmail: true,
      shareToken: true,
      repProfile: {
        select: {
          displayName: true,
          title: true,
          email: true,
          phone: true,
          signatureProfile: {
            select: { companyName: true, website: true, address: true },
          },
        },
      },
      lead: { select: { id: true, firstName: true, lastName: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json(proposal);
}
