import { describe, expect, it, vi } from 'vitest';

import {
  getRepCalendarWorkspace,
  getRepAlerts,
  getRepLeadActivityTimeline,
  getRepLeadById,
  getRepInboxThreads,
  getRepLeadInbox,
  getRepTaskSuggestions,
  getWorkspaceData,
  scheduleRepTask,
  snoozeRepTask,
  unscheduleRepTask,
  updateRepAlertStatus,
  updateRepTaskSuggestionStatus,
} from './workspace-service';

function createWorkspaceDbMock() {
  return {
    user: {
      findUnique: vi.fn(),
    },
    lead: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    activityLog: {
      findMany: vi.fn(),
    },
    careerMovementAlert: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    meeting: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    calendarEvent: {
      findMany: vi.fn(),
    },
    emailThread: {
      findMany: vi.fn(),
    },
    repTaskSuggestion: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as any;
}

describe('workspace service', () => {
  it('builds rep workspace data for sales reps', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      name: 'Jay Jones',
      email: 'jay.jones@trainovations.com',
      role: 'sales_rep',
      repProfile: {
        id: 'rep_1',
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        slug: 'jay-jones',
        bio: 'Rep bio',
        email: 'jay.jones@trainovations.com',
        phone: '555-101-2201',
        website: 'https://trainovations.com/jay-jones',
        location: 'Phoenix, Arizona',
        photoUrl: null,
        signatureProfile: {
          companyName: 'Trainovations',
        },
        landingPages: [{ slug: 'jay-jones', isPublished: true }],
      },
    });
    db.lead.count.mockResolvedValueOnce(12).mockResolvedValueOnce(4);
    db.careerMovementAlert.count.mockResolvedValue(2);
    db.meeting.count.mockResolvedValue(3);
    db.repTaskSuggestion.count.mockResolvedValue(2);
    db.careerMovementAlert.findMany.mockResolvedValue([
      {
        id: 'alert_1',
        title: 'Champion changed companies',
        message: 'A key contact moved to a new organization.',
        priority: 'urgent',
        triggeredAt: new Date('2026-03-13T00:00:00.000Z'),
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
        },
      },
    ]);
    db.lead.findMany.mockResolvedValue([
      {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
        status: 'new',
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        email: 'alex.stone@metrotransit.com',
        interest: 'Pilot rollout',
      },
    ]);
    db.meeting.findMany.mockResolvedValue([
      {
        id: 'meeting_1',
        topic: 'Metro Transit Demo',
        startAt: new Date('2026-03-12T15:00:00.000Z'),
        endAt: new Date('2026-03-12T15:30:00.000Z'),
        lead: {
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
        },
        callSummary: {
          summary: 'Aligned on a pilot rollout.',
          recommendedNextStep: 'Send pricing recap and proposal timing.',
        },
        actionItems: [
          {
            id: 'action_1',
            description: 'Send recap email',
            status: 'open',
          },
        ],
        emailDrafts: [
          {
            id: 'draft_1',
            subject: 'Great meeting today',
            bodyText: 'Thanks for the time today.',
            status: 'draft',
          },
        ],
      },
    ]);
    db.calendarEvent.findMany.mockResolvedValue([
      {
        id: 'cal_1',
        title: 'Chicago travel hold',
        description: 'Flight itinerary: AA4455. Hotel confirmation: HC7788.',
        startAt: new Date('2026-04-09T17:00:00.000Z'),
        endAt: new Date('2026-04-11T20:00:00.000Z'),
        sourceUrl: 'https://calendar.google.com',
      },
    ]);
    db.repTaskSuggestion.findMany.mockResolvedValue([
      {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'high',
        title: 'Respond to new lead',
        reason: 'This lead is still new and needs a first response.',
        explanation: 'Generated because no first-response workflow has been completed yet.',
        recommendedDueAt: new Date('2026-03-15T15:00:00.000Z'),
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
        },
      },
    ]);

    const result = await getWorkspaceData('user_1', 'sales_rep', db);

    expect(result?.destination).toBe('rep');
    expect(result?.repProfile?.publicLandingPath).toBe('/rep/jay-jones');
    expect(result?.repProfile?.vCardDownloadPath).toBe('/api/rep/jay-jones/vcard');
    expect(result?.repProfile?.metrics.totalLeads).toBe(12);
    expect(result?.repProfile?.metrics.meetingsProcessed).toBe(3);
    expect(result?.repProfile?.metrics.openTasks).toBe(2);
    expect(result?.repProfile?.recentLeads).toHaveLength(1);
    expect(result?.repProfile?.alertFeed).toHaveLength(1);
    expect(result?.repProfile?.recentMeetings).toHaveLength(1);
    expect(result?.repProfile?.leadMapPoints).toEqual([]);
    expect(result?.repProfile?.travelCalendarCandidates).toEqual([
      expect.objectContaining({
        id: 'cal_1',
        title: 'Chicago travel hold',
      }),
    ]);
    expect(result?.repProfile?.repTasks).toHaveLength(1);
  });

  it('returns an admin-style destination for non-rep roles', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_2',
      name: 'Morgan Manager',
      email: 'manager@trainovations.com',
      role: 'sales_manager',
      repProfile: null,
    });

    const result = await getWorkspaceData('user_2', 'sales_manager', db);

    expect(result).toEqual({
      user: {
        id: 'user_2',
        name: 'Morgan Manager',
        email: 'manager@trainovations.com',
        role: 'sales_manager',
      },
      destination: 'admin',
      repProfile: null,
    });
  });

  it('returns a rep-owned lead inbox with alert and meeting context', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.lead.findMany.mockResolvedValue([
      {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
        email: 'alex.stone@metrotransit.com',
        phone: '555-101-2201',
        location: 'Dallas, Texas',
        status: 'new',
        interest: 'Pilot rollout',
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        landingPage: {
          slug: 'jay-jones',
        },
        careerMovementAlerts: [{ id: 'alert_1' }],
        meetings: [
          {
            callSummary: {
              summary: 'Aligned on pilot next steps.',
            },
          },
        ],
      },
    ]);

    const result = await getRepLeadInbox('user_1', db);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'lead_1',
        landingPageSlug: 'jay-jones',
        location: 'Dallas, Texas',
        openAlertCount: 1,
        latestMeetingSummary: 'Aligned on pilot next steps.',
      }),
    ]);
  });

  it('returns linked inbox threads for a rep', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.emailThread.findMany.mockResolvedValue([
      {
        id: 'thread_1',
        subject: 'Metro Transit pilot follow-up',
        snippet: 'Can you send pricing?',
        unreadCount: 1,
        status: 'open',
        awaitingReply: false,
        followUpNeeded: false,
        snoozedUntil: null,
        lastMessageAt: new Date('2026-03-14T16:15:00.000Z'),
        participants: ['alex.stone@metrotransit.com', 'jay.jones@trainovations.com'],
        mailbox: {
          id: 'mailbox_1',
          label: 'Jay inbox',
          emailAddress: 'jay.jones@trainovations.com',
          provider: 'gmail',
        },
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
        },
        account: {
          id: 'account_1',
          name: 'Metro Transit Systems',
        },
        opportunity: {
          id: 'opportunity_1',
          name: 'Metro Transit Pilot Rollout',
          stage: 'discovery',
        },
        messages: [
          {
            id: 'message_1',
            direction: 'inbound',
            fromEmail: 'alex.stone@metrotransit.com',
            toEmails: ['jay.jones@trainovations.com'],
            bodyText: 'Can you send pricing?',
            sentAt: new Date('2026-03-14T16:15:00.000Z'),
            isRead: false,
          },
        ],
      },
    ]);

    const result = await getRepInboxThreads('user_1', 'open', db);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'thread_1',
        subject: 'Metro Transit pilot follow-up',
        unreadCount: 1,
        account: {
          id: 'account_1',
          name: 'Metro Transit Systems',
        },
      }),
    ]);
  });

  it('returns a rep calendar workspace with events and follow-up blocks', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.calendarEvent.findMany.mockResolvedValue([
      {
        id: 'event_1',
        title: 'Phoenix Rail kickoff',
        description: 'Review rollout scope and next steps.',
        startAt: new Date('2026-03-16T16:00:00.000Z'),
        endAt: new Date('2026-03-16T16:30:00.000Z'),
        syncStatus: 'synced',
        sourceUrl: 'https://calendar.google.com/event?eid=1',
        meetings: [
          {
            id: 'meeting_1',
            topic: 'Phoenix Rail kickoff',
            lead: {
              id: 'lead_1',
              firstName: 'Alex',
              lastName: 'Stone',
              company: 'Metro Transit Systems',
            },
            callSummary: {
              summary: 'Pilot scope review is ready.',
            },
          },
        ],
      },
    ]);
    db.repTaskSuggestion.findMany.mockResolvedValue([
      {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'high',
        title: 'Send pricing recap',
        reason: 'Meeting follow-up is still pending.',
        explanation: 'Use the approved pricing template.',
        recommendedDueAt: new Date('2026-03-17T18:00:00.000Z'),
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
        },
      },
    ]);
    db.meeting.findMany.mockResolvedValue([
      {
        id: 'meeting_1',
        topic: 'Phoenix Rail kickoff',
        startAt: new Date('2026-03-16T16:00:00.000Z'),
        lead: {
          firstName: 'Alex',
          lastName: 'Stone',
        },
        callSummary: {
          summary: 'Pilot scope review is ready.',
          recommendedNextStep: 'Send pricing recap.',
        },
      },
    ]);

    const result = await getRepCalendarWorkspace(
      'user_1',
      db,
      new Date('2026-03-14T09:00:00.000-07:00'),
    );

    expect(result.summary.scheduledCount).toBe(1);
    expect(result.summary.followUpCount).toBe(1);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'event_1',
        kind: 'calendar_event',
      }),
    );
    expect(result.items[1]).toEqual(
      expect.objectContaining({
        id: 'task_1',
        kind: 'task_follow_up',
        sourceUrl: '/workspace/leads/lead_1',
      }),
    );
    expect(result.recentMeetings[0]?.leadName).toBe('Alex Stone');
  });

  it('returns active rep task suggestions', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.repTaskSuggestion.findMany.mockResolvedValue([
      {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'high',
        title: 'Respond to new lead',
        reason: 'This lead is still new and needs a first response.',
        explanation: null,
        recommendedDueAt: new Date('2026-03-15T12:00:00.000Z'),
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
        },
      },
    ]);

    const result = await getRepTaskSuggestions('user_1', db);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'task_1',
        title: 'Respond to new lead',
      }),
    ]);
  });

  it('updates a rep task suggestion status', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.repTaskSuggestion.findFirst.mockResolvedValue({
      id: 'task_1',
      repProfileId: 'rep_1',
      lead: {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
      },
    });
    db.repTaskSuggestion.update.mockResolvedValue({
      id: 'task_1',
      type: 'send_follow_up',
      status: 'converted',
      priority: 'high',
      title: 'Respond to new lead',
      reason: 'This lead is still new and needs a first response.',
      explanation: null,
      recommendedDueAt: new Date('2026-03-15T12:00:00.000Z'),
      lead: {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
      },
    });

    const result = await updateRepTaskSuggestionStatus('user_1', 'task_1', 'converted', db);

    expect(result?.status).toBe('converted');
    expect(db.repTaskSuggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'task_1',
        },
      }),
    );
  });

  it('returns rep-owned alerts with lead context', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.careerMovementAlert.findMany.mockResolvedValue([
      {
        id: 'alert_1',
        title: 'Champion changed companies',
        message: 'A key contact moved to a new organization.',
        priority: 'urgent',
        status: 'open',
        suggestedNextStep: 'Reach out within 48 hours.',
        triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
        resolvedAt: null,
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
          email: 'alex@metrotransit.com',
        },
      },
    ]);

    const result = await getRepAlerts('user_1', db);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'alert_1',
        status: 'open',
        lead: expect.objectContaining({
          email: 'alex@metrotransit.com',
        }),
      }),
    ]);
  });

  it('updates alert status within rep scope', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.careerMovementAlert.findFirst = vi.fn().mockResolvedValue({
      id: 'alert_1',
      title: 'Champion changed companies',
      message: 'A key contact moved to a new organization.',
      priority: 'urgent',
      status: 'open',
      suggestedNextStep: 'Reach out within 48 hours.',
      triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
      resolvedAt: null,
      lead: {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
        email: 'alex@metrotransit.com',
      },
    });
    db.careerMovementAlert.update = vi.fn().mockResolvedValue({
      id: 'alert_1',
      title: 'Champion changed companies',
      message: 'A key contact moved to a new organization.',
      priority: 'urgent',
      status: 'resolved',
      suggestedNextStep: 'Reach out within 48 hours.',
      triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
      resolvedAt: new Date('2026-03-14T14:00:00.000Z'),
      lead: {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
        email: 'alex@metrotransit.com',
      },
    });

    const result = await updateRepAlertStatus('user_1', 'alert_1', 'resolved', db);

    expect(db.careerMovementAlert.update).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 'alert_1',
        status: 'resolved',
      }),
    );
  });

  it('returns a rep-safe lead detail view', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.lead.findFirst.mockResolvedValue({
      id: 'lead_1',
      repProfileId: 'rep_1',
      firstName: 'Alex',
      lastName: 'Stone',
      company: 'Metro Transit Systems',
      jobTitle: 'Training Director',
      email: 'alex@metrotransit.com',
      phone: '555-101-2201',
      location: 'Dallas, Texas',
      industry: 'Transit',
      interest: 'Pilot rollout',
      notes: 'Met at expo.',
      consent: true,
      status: 'new',
      sourceType: 'manual',
      submittedAt: new Date('2026-03-14T12:00:00.000Z'),
      landingPage: {
        slug: 'jay-jones',
        title: 'Jay Jones | Trainovations',
      },
      duplicateOfLead: null,
      notesList: [],
      careerMovementAlerts: [],
      meetings: [],
      accountLinks: [
        {
          relationshipLabel: 'Primary contact',
          account: {
            id: 'account_1',
            name: 'Metro Transit Systems',
          },
        },
      ],
      primaryOpportunities: [
        {
          id: 'opportunity_1',
          name: 'Metro Transit Pilot Rollout',
          stage: 'discovery',
          amountCents: 8500000,
        },
      ],
      repTaskSuggestions: [],
      repProfile: {
        location: 'Phoenix, Arizona',
      },
    });

    const result = await getRepLeadById('user_1', 'lead_1', db);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'lead_1',
        location: 'Dallas, Texas',
        repLocation: 'Phoenix, Arizona',
        accounts: [
          expect.objectContaining({
            name: 'Metro Transit Systems',
          }),
        ],
      }),
    );
  });

  it('returns rep-scoped lead activity timeline entries', async () => {
    const db = createWorkspaceDbMock();

    db.user.findUnique.mockResolvedValue({
      id: 'user_1',
      repProfile: {
        id: 'rep_1',
      },
    });
    db.activityLog.findMany.mockResolvedValue([
      {
        id: 'log_1',
        type: 'lead_created',
        description: 'Lead created.',
        createdAt: new Date('2026-03-14T12:00:00.000Z'),
        actorUser: {
          name: 'Jay Jones',
          email: 'jay.jones@trainovations.com',
        },
      },
    ]);

    const result = await getRepLeadActivityTimeline('user_1', 'lead_1', db);

    expect(db.activityLog.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  describe('scheduleRepTask', () => {
    it('sets scheduledAt and scheduledEndAt on the task', async () => {
      const db = createWorkspaceDbMock();
      const scheduledAt = new Date('2026-03-20T14:00:00.000Z');
      const expectedEnd = new Date('2026-03-20T14:30:00.000Z');

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });

      const taskRecord = {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'high',
        title: 'Respond to new lead',
        reason: 'New lead needs a response.',
        explanation: null,
        recommendedDueAt: new Date('2026-03-18T09:00:00.000Z'),
        scheduledAt,
        scheduledEndAt: expectedEnd,
        snoozedUntil: null,
        lead: { id: 'lead_1', firstName: 'Alex', lastName: 'Stone', company: 'Metro Transit Systems' },
      };

      db.repTaskSuggestion.findFirst.mockResolvedValue(taskRecord);
      db.repTaskSuggestion.update.mockResolvedValue(taskRecord);

      const result = await scheduleRepTask('user_1', 'task_1', scheduledAt, 30, db);

      expect(db.repTaskSuggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledAt,
            scheduledEndAt: expectedEnd,
          }),
        }),
      );

      expect(result?.scheduledAt).toEqual(scheduledAt);
      expect(result?.scheduledEndAt).toEqual(expectedEnd);
    });

    it('returns null if the task does not belong to the rep', async () => {
      const db = createWorkspaceDbMock();

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });
      db.repTaskSuggestion.findFirst.mockResolvedValue(null);

      const result = await scheduleRepTask('user_1', 'task_99', new Date(), 30, db);

      expect(result).toBeNull();
      expect(db.repTaskSuggestion.update).not.toHaveBeenCalled();
    });
  });

  describe('unscheduleRepTask', () => {
    it('clears scheduledAt and scheduledEndAt', async () => {
      const db = createWorkspaceDbMock();

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });

      const taskRecord = {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'high',
        title: 'Follow up',
        reason: 'Needs follow-up.',
        explanation: null,
        recommendedDueAt: null,
        scheduledAt: null,
        scheduledEndAt: null,
        snoozedUntil: null,
        lead: null,
      };

      db.repTaskSuggestion.findFirst.mockResolvedValue(taskRecord);
      db.repTaskSuggestion.update.mockResolvedValue(taskRecord);

      const result = await unscheduleRepTask('user_1', 'task_1', db);

      expect(db.repTaskSuggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { scheduledAt: null, scheduledEndAt: null },
        }),
      );

      expect(result?.scheduledAt).toBeNull();
    });
  });

  describe('snoozeRepTask', () => {
    it('sets snoozedUntil on the task', async () => {
      const db = createWorkspaceDbMock();
      const snoozedUntil = new Date('2026-03-18T09:00:00.000Z');

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });

      const taskRecord = {
        id: 'task_1',
        type: 'send_follow_up',
        status: 'generated',
        priority: 'medium',
        title: 'Check in',
        reason: 'No response yet.',
        explanation: null,
        recommendedDueAt: null,
        scheduledAt: null,
        scheduledEndAt: null,
        snoozedUntil,
        lead: null,
      };

      db.repTaskSuggestion.findFirst.mockResolvedValue(taskRecord);
      db.repTaskSuggestion.update.mockResolvedValue(taskRecord);

      const result = await snoozeRepTask('user_1', 'task_1', snoozedUntil, db);

      expect(db.repTaskSuggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { snoozedUntil },
        }),
      );

      expect(result?.snoozedUntil).toEqual(snoozedUntil);
    });
  });

  describe('getRepCalendarWorkspace - Stage 2 scheduling', () => {
    it('uses scheduledAt for calendar item placement when set', async () => {
      const db = createWorkspaceDbMock();
      const now = new Date('2026-03-15T12:00:00.000Z');
      const scheduledAt = new Date('2026-03-18T10:00:00.000Z');
      const scheduledEndAt = new Date('2026-03-18T10:30:00.000Z');

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });

      db.calendarEvent.findMany.mockResolvedValue([]);
      db.repTaskSuggestion.findMany.mockResolvedValue([
        {
          id: 'task_1',
          type: 'send_follow_up',
          status: 'generated',
          priority: 'high',
          title: 'Confirm proposal timing',
          reason: 'Proposal is ready to send.',
          explanation: null,
          recommendedDueAt: new Date('2026-03-19T00:00:00.000Z'),
          scheduledAt,
          scheduledEndAt,
          snoozedUntil: null,
          lead: null,
        },
      ]);
      db.meeting.findMany.mockResolvedValue([]);

      const result = await getRepCalendarWorkspace('user_1', db, now);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].startAt).toEqual(scheduledAt);
      expect(result.items[0].endAt).toEqual(scheduledEndAt);
      expect(result.items[0].isScheduled).toBe(true);
    });

    it('excludes snoozed tasks from the calendar feed', async () => {
      const db = createWorkspaceDbMock();
      const now = new Date('2026-03-15T12:00:00.000Z');

      db.user.findUnique.mockResolvedValue({
        id: 'user_1',
        repProfile: { id: 'rep_1' },
      });

      db.calendarEvent.findMany.mockResolvedValue([]);
      // snoozed tasks are filtered at the DB query level via OR condition
      db.repTaskSuggestion.findMany.mockResolvedValue([]);
      db.meeting.findMany.mockResolvedValue([]);

      const result = await getRepCalendarWorkspace('user_1', db, now);

      const repTaskWhere = db.repTaskSuggestion.findMany.mock.calls[0][0].where;
      const snoozeCondition = repTaskWhere.AND?.[0]?.OR;
      expect(snoozeCondition).toEqual(
        expect.arrayContaining([
          { snoozedUntil: null },
          { snoozedUntil: { lte: now } },
        ]),
      );

      expect(result.items).toHaveLength(0);
    });
  });
});
