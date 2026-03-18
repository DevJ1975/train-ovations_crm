import { OutreachDraftStatus, OutreachDraftType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { OutreachDraftService } from './outreach-draft-service';

describe('OutreachDraftService', () => {
  it('generates a reviewable outreach draft from lead context', async () => {
    const db = {
      lead: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ck1234567890123456789012',
          firstName: 'Taylor',
          company: 'Northstar Rail',
          interest: 'Safety program review',
          status: 'new',
          email: 'taylor@northstarrail.com',
          repProfileId: 'ck2234567890123456789012',
          repProfile: {
            displayName: 'Jay Jones',
            title: 'Safety Specialist',
            signatureProfile: {
              jobTitle: 'Safety Technology Specialist',
              companyName: 'Trainovations',
            },
          },
          careerMovementAlerts: [],
          meetings: [],
        }),
      },
      outreachDraft: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({
          id: 'ck3234567890123456789012',
          type: OutreachDraftType.lead_follow_up,
          status: OutreachDraftStatus.generated,
        }),
      },
      draftGenerationContext: {
        create: vi.fn().mockResolvedValue({ id: 'ck4234567890123456789012' }),
      },
    } as any;

    const result = await OutreachDraftService.generateDraftForLead(
      'ck1234567890123456789012',
      'ck5234567890123456789012',
      db,
    );

    expect(db.outreachDraft.updateMany).toHaveBeenCalled();
    expect(db.outreachDraft.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        repProfileId: 'ck2234567890123456789012',
        recipientEmail: 'taylor@northstarrail.com',
        type: OutreachDraftType.lead_follow_up,
      }),
    });
    expect(db.draftGenerationContext.create).toHaveBeenCalled();
    expect(result.status).toBe(OutreachDraftStatus.generated);
  });

  it('updates outreach draft status and audit editor metadata', async () => {
    const db = {
      outreachDraft: {
        update: vi.fn().mockResolvedValue({
          id: 'ck6234567890123456789012',
          status: OutreachDraftStatus.approved,
        }),
      },
    } as any;

    await OutreachDraftService.updateDraftStatus(
      'ck6234567890123456789012',
      OutreachDraftStatus.approved,
      'ck5234567890123456789012',
      db,
    );

    expect(db.outreachDraft.update).toHaveBeenCalledWith({
      where: { id: 'ck6234567890123456789012' },
      data: expect.objectContaining({
        status: OutreachDraftStatus.approved,
        lastEditedByUserId: 'ck5234567890123456789012',
      }),
    });
  });
});
