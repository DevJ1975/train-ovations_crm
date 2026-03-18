import { ActivityLogType, LeadStatus, SourceType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import {
  createLead,
  createLeadFromPublicLandingPage,
  createLeadNote,
  deleteLead,
  findPotentialDuplicateLead,
  updateLead,
  updateLeadStatus,
} from './lead-service';

function createDbMock() {
  return {
    lead: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    landingPage: {
      findUnique: vi.fn(),
    },
    leadNote: {
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  } as any;
}

describe('lead service', () => {
  it('finds a potential duplicate lead by email and rep owner', async () => {
    const db = createDbMock();

    db.lead.findFirst.mockResolvedValue({ id: 'lead_1' });

    const result = await findPotentialDuplicateLead(
      {
        email: 'Alex@Company.com',
        repProfileId: 'rep_1',
        company: 'Acme Rail',
      },
      db as never,
    );

    expect(db.lead.findFirst).toHaveBeenCalledWith({
      where: {
        repProfileId: 'rep_1',
        OR: [
          { email: 'alex@company.com' },
          { email: 'alex@company.com', company: 'Acme Rail' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(result).toEqual({ id: 'lead_1' });
  });

  it('creates a lead and logs duplicate metadata when present', async () => {
    const db = createDbMock();

    db.lead.findFirst.mockResolvedValue({ id: 'lead_existing' });
    db.lead.create.mockResolvedValue({
      id: 'lead_new',
      firstName: 'Alex',
      lastName: 'Stone',
      repProfileId: 'ck1234567890123456789012',
      sourceType: SourceType.landing_page,
    });
    db.activityLog.create
      .mockResolvedValueOnce({ id: 'log_1' })
      .mockResolvedValueOnce({ id: 'log_2' });

    const result = await createLead(
      {
        repProfileId: 'ck1234567890123456789012',
        firstName: 'Alex',
        lastName: 'Stone',
        email: 'Alex@Company.com',
        consent: true,
        status: LeadStatus.new,
        sourceType: SourceType.manual,
      },
      db as never,
    );

    expect(db.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'alex@company.com',
        duplicateOfLeadId: 'lead_existing',
      }),
    });
    expect(db.activityLog.create).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('lead_new');
  });

  it('creates a lead note and audit record', async () => {
    const db = createDbMock();

    db.leadNote.create.mockResolvedValue({
      id: 'note_1',
      leadId: 'lead_1',
      authorId: 'user_1',
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_2' });

    const result = await createLeadNote(
      {
        leadId: 'ck1234567890123456789012',
        authorId: 'ck1234567890123456789013',
        sourceType: 'user_authored',
        content: 'Reached out by email.',
      },
      db as never,
    );

    expect(result.id).toBe('note_1');
    expect(db.activityLog.create).toHaveBeenCalled();
  });

  it('updates lead status and logs the change', async () => {
    const db = createDbMock();

    db.lead.update.mockResolvedValue({
      id: 'lead_1',
      repProfileId: 'rep_1',
      status: LeadStatus.contacted,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_status' });

    const result = await updateLeadStatus(
      {
        leadId: 'lead_1',
        status: LeadStatus.contacted,
        actorUserId: 'user_1',
      },
      db as never,
    );

    expect(db.lead.update).toHaveBeenCalledWith({
      where: {
        id: 'lead_1',
      },
      data: {
        status: LeadStatus.contacted,
      },
    });
    expect(db.activityLog.create).toHaveBeenCalled();
    expect(result.status).toBe(LeadStatus.contacted);
  });

  it('updates manual lead details and refreshes duplicate metadata', async () => {
    const db = createDbMock();

    db.lead.findUnique.mockResolvedValue({
      id: 'lead_1',
      repProfileId: 'rep_1',
      firstName: 'Alex',
      lastName: 'Stone',
    });
    db.lead.findFirst.mockResolvedValue({ id: 'lead_existing' });
    db.lead.update.mockResolvedValue({
      id: 'lead_1',
      firstName: 'Alex',
      lastName: 'Stone',
      repProfileId: 'rep_1',
      duplicateOfLeadId: 'lead_existing',
      email: 'alex@company.com',
      phone: null,
      company: 'Acme Rail',
      jobTitle: null,
      industry: null,
      interest: null,
      notes: null,
      consent: true,
      status: LeadStatus.new,
      sourceType: SourceType.manual,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_2' });

    const result = await updateLead(
      {
        leadId: 'lead_1',
        actorUserId: 'user_1',
        data: {
          firstName: 'Alex',
          lastName: 'Stone',
          email: 'Alex@Company.com',
          company: 'Acme Rail',
          consent: true,
          status: LeadStatus.new,
        },
      },
      db as never,
    );

    expect(db.lead.update).toHaveBeenCalledWith({
      where: {
        id: 'lead_1',
      },
      data: expect.objectContaining({
        email: 'alex@company.com',
        duplicateOfLeadId: 'lead_existing',
      }),
    });
    expect(result.duplicateOfLeadId).toBe('lead_existing');
  });

  it('deletes a lead when requested', async () => {
    const db = createDbMock();

    db.lead.findUnique.mockResolvedValue({
      id: 'lead_1',
      repProfileId: 'rep_1',
      firstName: 'Alex',
      lastName: 'Stone',
    });
    db.lead.delete.mockResolvedValue({ id: 'lead_1' });

    await deleteLead(
      {
        leadId: 'lead_1',
        actorUserId: 'user_1',
      },
      db as never,
    );

    expect(db.lead.delete).toHaveBeenCalledWith({
      where: {
        id: 'lead_1',
      },
    });
  });

  it('supports custom meeting-specific activity logging for generated notes', async () => {
    const db = createDbMock();

    db.leadNote.create.mockResolvedValue({
      id: 'note_2',
      leadId: 'lead_1',
      authorId: null,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_4' });

    await createLeadNote(
      {
        leadId: 'ck1234567890123456789012',
        meetingId: 'ck1234567890123456789014',
        sourceType: 'ai_generated',
        content: 'AI meeting note.',
      },
      {
        activityType: ActivityLogType.meeting_note_created,
        activityDescription: 'AI-generated CRM note created from processed meeting outputs.',
        activityMetadata: {
          meetingId: 'ck1234567890123456789014',
        },
      },
      db as never,
    );

    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.meeting_note_created,
        description:
          'AI-generated CRM note created from processed meeting outputs.',
        metadata: {
          meetingId: 'ck1234567890123456789014',
        },
      }),
    });
  });

  it('creates a lead from public landing metadata', async () => {
    const db = createDbMock();

    db.landingPage.findUnique.mockResolvedValue({
      id: 'ck1234567890123456789013',
      slug: 'jay-jones',
      repProfile: {
        id: 'ck1234567890123456789012',
        slug: 'jay-jones',
      },
    });
    db.lead.findFirst.mockResolvedValue(null);
    db.lead.create.mockResolvedValue({
      id: 'lead_public',
      firstName: 'Jamie',
      lastName: 'Stone',
      repProfileId: 'ck1234567890123456789012',
      sourceType: SourceType.landing_page,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_3' });

    const result = await createLeadFromPublicLandingPage(
      {
        repSlug: 'jay-jones',
        landingPageId: 'ck1234567890123456789013',
        submittedAt: '2026-03-13T12:00:00.000Z',
        firstName: 'Jamie',
        lastName: 'Stone',
        email: 'jamie@company.com',
        consent: true,
        companyEmailWebsite: '',
      },
      db as never,
    );

    expect(db.landingPage.findUnique).toHaveBeenCalledWith({
      where: { id: 'ck1234567890123456789013' },
      include: {
        repProfile: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });
    expect(result).toMatchObject({
      outcome: 'created',
      lead: {
        id: 'lead_public',
      },
    });
  });

  it('returns spam for honeypot submissions without touching the database', async () => {
    const db = createDbMock();

    const result = await createLeadFromPublicLandingPage(
      {
        repSlug: 'jay-jones',
        landingPageId: 'ck1234567890123456789013',
        firstName: 'Spam',
        lastName: 'Bot',
        email: 'spam@example.com',
        consent: true,
        companyEmailWebsite: 'https://spam.invalid',
      },
      db as never,
    );

    expect(result).toEqual({
      outcome: 'spam',
    });
    expect(db.landingPage.findUnique).not.toHaveBeenCalled();
  });
});
