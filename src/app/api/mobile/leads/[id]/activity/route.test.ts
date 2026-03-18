import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getRepLeadActivityTimeline } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getRepLeadActivityTimeline: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/services', () => ({ getRepLeadActivityTimeline }));

import { GET } from './route';

const mockEntries = [
  {
    id: 'act_1',
    type: 'note_created',
    description: 'Note added',
    repProfileId: 'rep_1',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
  },
  {
    id: 'act_2',
    type: 'status_changed',
    description: 'Status changed to contacted',
    repProfileId: 'rep_1',
    createdAt: new Date('2026-03-02T12:00:00.000Z'),
  },
];

const ctx = { params: Promise.resolve({ id: 'lead_1' }) };

describe('/api/mobile/leads/[id]/activity', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getRepLeadActivityTimeline.mockResolvedValue(mockEntries);
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1/activity'), ctx);
    expect(res.status).toBe(401);
  });

  it('returns serialized activity timeline', async () => {
    const res = await GET(
      new Request('http://localhost/api/mobile/leads/lead_1/activity'),
      ctx,
    );
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].id).toBe('act_1');
    expect(payload.items[0].entityType).toBe('lead');
    expect(payload.items[0].entityId).toBe('lead_1');
    expect(payload.items[0].createdAt).toBe('2026-03-01T10:00:00.000Z');
  });

  it('calls getRepLeadActivityTimeline with correct args', async () => {
    await GET(new Request('http://localhost/api/mobile/leads/lead_1/activity'), ctx);
    expect(getRepLeadActivityTimeline).toHaveBeenCalledWith('user_1', 'lead_1');
  });

  it('returns empty items array when timeline is empty', async () => {
    getRepLeadActivityTimeline.mockResolvedValue([]);
    const res = await GET(
      new Request('http://localhost/api/mobile/leads/lead_1/activity'),
      ctx,
    );
    const payload = await res.json();
    expect(payload.items).toHaveLength(0);
  });
});
