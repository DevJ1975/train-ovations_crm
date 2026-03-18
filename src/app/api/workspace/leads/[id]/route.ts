import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { deleteLead, getRepLeadById, updateLead } from '@/lib/services';
import { updateManualLeadSchema } from '@/lib/validation/crm';

interface WorkspaceLeadRouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function requireAccessibleLead(id: string) {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    } as const;
  }

  const lead = await getRepLeadById(user.id, id);

  if (!lead) {
    return {
      error: NextResponse.json({ error: 'Lead not found' }, { status: 404 }),
    } as const;
  }

  return { user, lead } as const;
}

export async function PATCH(request: Request, context: WorkspaceLeadRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleLead(id);

  if ('error' in access) {
    return access.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateManualLeadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid lead payload',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const lead = await updateLead({
    leadId: id,
    actorUserId: access.user.id,
    repProfileId: access.lead.repProfileId ?? undefined,
    data: parsed.data,
  });

  return NextResponse.json({
    lead: {
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      submittedAt: lead.submittedAt?.toISOString() ?? null,
    },
  });
}

export async function DELETE(_request: Request, context: WorkspaceLeadRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleLead(id);

  if ('error' in access) {
    return access.error;
  }

  await deleteLead({
    leadId: id,
    actorUserId: access.user.id,
    repProfileId: access.lead.repProfileId ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
