import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { listTemplates, saveProposalAsTemplate } from '@/lib/services/proposal-engine-service';
import { createTemplateSchema } from '@/lib/validation/proposal-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const templates = await listTemplates(user.id);
  return NextResponse.json({ templates });
}
