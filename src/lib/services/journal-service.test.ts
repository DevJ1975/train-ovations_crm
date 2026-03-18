import { describe, expect, it, vi } from 'vitest';

import {
  createRepJournalEntry,
  deleteRepJournalEntry,
  getRepJournalEntries,
} from './journal-service';

const NOW = new Date('2026-03-15T12:00:00Z');

function makeEntry(overrides: Partial<{
  id: string;
  title: string | null;
  body: string;
  repProfileId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'entry_1',
    title: 'Field notes',
    body: 'Met with the transit authority today.',
    repProfileId: 'rep_1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeDb(overrides: Partial<ReturnType<typeof makeDefaultDb>> = {}) {
  return { ...makeDefaultDb(), ...overrides } as any;
}

function makeDefaultDb() {
  return {
    user: {
      findUnique: vi.fn(),
    },
    repJournalEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function mockRepUser(db: ReturnType<typeof makeDefaultDb>, repProfileId = 'rep_1') {
  db.user.findUnique.mockResolvedValue({
    id: 'user_1',
    repProfile: { id: repProfileId },
  });
}

// ---------------------------------------------------------------------------
// getRepJournalEntries
// ---------------------------------------------------------------------------

describe('getRepJournalEntries', () => {
  it('returns entries sorted by createdAt desc', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);
    const entry = makeEntry();
    db.repJournalEntry.findMany.mockResolvedValue([entry]);

    const result = await getRepJournalEntries('user_1', db as any);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry_1');
    expect(db.repJournalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { repProfileId: 'rep_1' },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('returns empty array when user has no rep profile', async () => {
    const db = makeDefaultDb();
    db.user.findUnique.mockResolvedValue({ id: 'user_1', repProfile: null });

    const result = await getRepJournalEntries('user_1', db as any);

    expect(result).toEqual([]);
    expect(db.repJournalEntry.findMany).not.toHaveBeenCalled();
  });

  it('returns empty array when user is not found', async () => {
    const db = makeDefaultDb();
    db.user.findUnique.mockResolvedValue(null);

    const result = await getRepJournalEntries('ghost_user', db as any);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createRepJournalEntry
// ---------------------------------------------------------------------------

describe('createRepJournalEntry', () => {
  it('creates and returns a new entry with a title', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);
    const created = makeEntry();
    db.repJournalEntry.create.mockResolvedValue(created);

    const result = await createRepJournalEntry(
      'user_1',
      { title: 'Field notes', body: 'Met with the transit authority today.' },
      db as any,
    );

    expect(result.id).toBe('entry_1');
    expect(result.title).toBe('Field notes');
    expect(db.repJournalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          repProfileId: 'rep_1',
          body: 'Met with the transit authority today.',
        }),
      }),
    );
  });

  it('creates an entry without a title (untitled)', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);
    const created = makeEntry({ title: null });
    db.repJournalEntry.create.mockResolvedValue(created);

    const result = await createRepJournalEntry(
      'user_1',
      { body: 'Quick note.' },
      db as any,
    );

    expect(result.title).toBeNull();
    expect(db.repJournalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ repProfileId: 'rep_1' }),
      }),
    );
  });

  it('throws when the user has no rep profile', async () => {
    const db = makeDefaultDb();
    db.user.findUnique.mockResolvedValue({ id: 'user_1', repProfile: null });

    await expect(
      createRepJournalEntry('user_1', { body: 'Should fail.' }, db as any),
    ).rejects.toThrow('Rep profile not found');
  });

  it('rejects an empty body', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);

    await expect(
      createRepJournalEntry('user_1', { body: '   ' }, db as any),
    ).rejects.toThrow();

    expect(db.repJournalEntry.create).not.toHaveBeenCalled();
  });

  it('rejects a title that exceeds 200 characters', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);

    await expect(
      createRepJournalEntry(
        'user_1',
        { title: 'x'.repeat(201), body: 'Valid body.' },
        db as any,
      ),
    ).rejects.toThrow();

    expect(db.repJournalEntry.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// deleteRepJournalEntry
// ---------------------------------------------------------------------------

describe('deleteRepJournalEntry', () => {
  it('deletes the entry when ownership is verified', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);
    db.repJournalEntry.findUnique.mockResolvedValue(makeEntry());
    db.repJournalEntry.delete.mockResolvedValue(undefined);

    await expect(
      deleteRepJournalEntry('user_1', 'entry_1', db as any),
    ).resolves.toBeUndefined();

    expect(db.repJournalEntry.delete).toHaveBeenCalledWith({
      where: { id: 'entry_1' },
    });
  });

  it('throws when the entry belongs to a different rep', async () => {
    const db = makeDefaultDb();
    mockRepUser(db, 'rep_1');
    // Entry is owned by a different rep
    db.repJournalEntry.findUnique.mockResolvedValue(
      makeEntry({ repProfileId: 'rep_2' }),
    );

    await expect(
      deleteRepJournalEntry('user_1', 'entry_1', db as any),
    ).rejects.toThrow('access denied');

    expect(db.repJournalEntry.delete).not.toHaveBeenCalled();
  });

  it('throws when the entry does not exist', async () => {
    const db = makeDefaultDb();
    mockRepUser(db);
    db.repJournalEntry.findUnique.mockResolvedValue(null);

    await expect(
      deleteRepJournalEntry('user_1', 'nonexistent', db as any),
    ).rejects.toThrow('not found');

    expect(db.repJournalEntry.delete).not.toHaveBeenCalled();
  });

  it('throws when the user has no rep profile', async () => {
    const db = makeDefaultDb();
    db.user.findUnique.mockResolvedValue({ id: 'user_1', repProfile: null });

    await expect(
      deleteRepJournalEntry('user_1', 'entry_1', db as any),
    ).rejects.toThrow('Rep profile not found');

    expect(db.repJournalEntry.delete).not.toHaveBeenCalled();
  });
});
