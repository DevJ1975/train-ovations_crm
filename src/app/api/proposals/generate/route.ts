import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { generateProposalWithAI } from '@/lib/ai/proposal-generator';
import { loadProposalContext, updateRepProposal } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser('/workspace/proposals');

    if (user.role !== 'sales_rep') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as { proposalId?: string };
    const proposalId = body?.proposalId;

    if (!proposalId || typeof proposalId !== 'string') {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 });
    }

    const context = await loadProposalContext(user.id, proposalId);
    const generated = await generateProposalWithAI(context);

    await updateRepProposal(user.id, proposalId, {
      title: generated.title,
      executiveSummary: generated.executiveSummary,
      aboutUs: generated.aboutUs,
      scopeOfWork: generated.scopeOfWork,
      deliverables: generated.deliverables,
      timeline: generated.timeline,
      pricing: generated.pricing,
      terms: generated.terms,
      nextSteps: generated.nextSteps,
      totalValueCents: generated.totalValueCents,
      aiGeneratedAt: new Date(),
    });

    return NextResponse.json({ success: true, proposal: generated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
