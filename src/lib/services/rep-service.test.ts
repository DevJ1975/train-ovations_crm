import { describe, expect, it, vi } from 'vitest';

import { createRepProfile, getRepProfileBySlug, updateRepProfile } from './rep-service';

function createDbMock() {
  return {
    repProfile: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  } as any;
}

describe('rep service', () => {
  it('creates a rep profile and logs the activity', async () => {
    const db = createDbMock();

    db.repProfile.create.mockResolvedValue({
      id: 'rep_1',
      userId: 'ck1234567890123456789012',
      displayName: 'Jay Jones',
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });

    const result = await createRepProfile(
      {
        userId: 'ck1234567890123456789012',
        slug: 'jay-jones',
        firstName: 'Jay',
        lastName: 'Jones',
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        bio: 'Experienced Trainovations rep focused on enterprise rail and transit safety programs.',
        email: 'jay.jones@trainovations.com',
        isActive: true,
      },
      db as never,
    );

    expect(db.repProfile.create).toHaveBeenCalled();
    expect(db.activityLog.create).toHaveBeenCalled();
    expect(result.id).toBe('rep_1');
  });

  it('updates a rep profile and writes an audit entry', async () => {
    const db = createDbMock();

    db.repProfile.update.mockResolvedValue({
      id: 'rep_1',
      userId: 'ck1234567890123456789012',
      displayName: 'Jay Jones',
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_2' });

    await updateRepProfile(
      'rep_1',
      {
        title: 'Regional Sales Consultant',
      },
      db as never,
    );

    expect(db.repProfile.update).toHaveBeenCalledWith({
      where: { id: 'rep_1' },
      data: { title: 'Regional Sales Consultant' },
    });
    expect(db.activityLog.create).toHaveBeenCalled();
  });

  it('retrieves a rep profile by slug with related records', async () => {
    const db = createDbMock();

    db.repProfile.findUnique.mockResolvedValue({
      id: 'rep_1',
      slug: 'jay-jones',
    });

    const result = await getRepProfileBySlug('jay-jones', db as never);

    expect(db.repProfile.findUnique).toHaveBeenCalledWith({
      where: { slug: 'jay-jones' },
      include: expect.any(Object),
    });
    expect(result).toEqual({
      id: 'rep_1',
      slug: 'jay-jones',
    });
  });
});
