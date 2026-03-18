import { describe, expect, it, vi } from 'vitest';

import { RelationshipGraphService } from './relationship-graph-service';

function createDbMock() {
  return {
    lead: {
      findUnique: vi.fn(),
    },
    relationshipHistory: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    relationshipMilestone: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    contactCompanyAssociation: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    relationshipEdge: {
      findMany: vi.fn(),
    },
    championFlag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    contactWatchlist: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  } as const;
}

describe('RelationshipGraphService', () => {
  it('returns a lead relationship graph payload', async () => {
    const db = createDbMock();

    db.lead.findUnique.mockResolvedValue({ id: 'lead_1' });
    db.relationshipHistory.findMany.mockResolvedValue([{ id: 'history_1' }]);
    db.relationshipMilestone.findMany.mockResolvedValue([{ id: 'milestone_1' }]);
    db.contactCompanyAssociation.findMany.mockResolvedValue([{ id: 'assoc_1' }]);
    db.relationshipEdge.findMany.mockResolvedValue([{ id: 'edge_1' }]);

    const result = await RelationshipGraphService.getLeadRelationshipGraph(
      'lead_1',
      db as never,
    );

    expect(result).toEqual({
      lead: { id: 'lead_1' },
      history: [{ id: 'history_1' }],
      milestones: [{ id: 'milestone_1' }],
      companyAssociations: [{ id: 'assoc_1' }],
      edges: [{ id: 'edge_1' }],
    });
  });

  it('returns rep relationship context with related companies', async () => {
    const db = createDbMock();

    db.relationshipEdge.findMany.mockResolvedValue([
      { id: 'edge_1', label: 'Known through implementation kickoff' },
    ]);
    db.championFlag.findMany.mockResolvedValue([{ id: 'champion_1' }]);
    db.relationshipHistory.findMany.mockResolvedValue([
      { id: 'history_1', companyName: 'New Rail' },
    ]);

    const result = await RelationshipGraphService.getRepRelationshipContext(
      'rep_1',
      db as never,
    );

    expect(result).toEqual({
      knownContacts: [{ id: 'edge_1', label: 'Known through implementation kickoff' }],
      championFlags: [{ id: 'champion_1' }],
      recentRelationshipHistory: [{ id: 'history_1', companyName: 'New Rail' }],
      relatedCompanies: ['New Rail', 'Known through implementation kickoff'],
    });
  });
});
