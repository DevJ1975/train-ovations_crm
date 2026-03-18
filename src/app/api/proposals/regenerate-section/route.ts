import { NextResponse } from 'next/server';
import type { GeneratedProposal } from '@/lib/ai/proposal-generator';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { regenerateSectionWithAI } from '@/lib/ai/proposal-generator';
import { loadProposalContext } from '@/lib/services';

const VALID_SECTIONS: Array<keyof Omit<GeneratedProposal, 'totalValueCents'>> = [
  'title',
  'executiveSummary',
  'aboutUs',
  'scopeOfWork',
  'deliverables',
  'timeline',
  'pricing',
  'terms',
  'nextSteps',
];

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser('/workspace/proposals');

    if (user.role !== 'sales_rep') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      proposalId?: string;
      sectionKey?: string;
      currentContent?: string;
      instruction?: string;
    };

    const { proposalId, sectionKey, currentContent, instruction } = body;

    if (!proposalId || !sectionKey || !VALID_SECTIONS.includes(sectionKey as keyof Omit<GeneratedProposal, 'totalValueCents'>)) {
      return NextResponse.json({ error: 'proposalId and valid sectionKey are required' }, { status: 400 });
    }

    const context = await loadProposalContext(user.id, proposalId);
    const newContent = await regenerateSectionWithAI(
      context,
      sectionKey as keyof Omit<GeneratedProposal, 'totalValueCents'>,
      currentContent ?? '',
      instruction,
    );

    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Regeneration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
