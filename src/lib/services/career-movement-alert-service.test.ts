import {
  ActivityLogType,
  AlertPriority,
  EmploymentChangeType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { CareerMovementAlertService } from './career-movement-alert-service';

describe('CareerMovementAlertService', () => {
  it('elevates priority for champion company moves', () => {
    expect(
      CareerMovementAlertService.derivePriority({
        changeType: EmploymentChangeType.company_changed,
        isChampion: true,
        watchlistPriority: 'critical',
      }),
    ).toBe(AlertPriority.urgent);
  });

  it('creates champion-move activity when needed', async () => {
    const db = {
      careerMovementAlert: {
        create: vi.fn().mockResolvedValue({ id: 'ck3234567890123456789012' }),
      },
      repActionPrompt: {
        create: vi.fn().mockResolvedValue({ id: 'ck4234567890123456789012' }),
      },
      activityLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
      },
    };

    const alert = await CareerMovementAlertService.createAlertForEmploymentChange(
      {
        id: 'ck2234567890123456789012',
        leadId: 'ck1234567890123456789012',
        changeType: EmploymentChangeType.company_changed,
        companyFrom: 'Old Co',
        companyTo: 'New Co',
        confidenceScore: 0.92,
      } as never,
      {
        isChampion: true,
      },
      db as never,
    );

    expect(alert).toEqual({ id: 'ck3234567890123456789012' });
    expect(db.activityLog.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          type: ActivityLogType.career_movement_alert_created,
        }),
      }),
    );
    expect(db.activityLog.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          type: ActivityLogType.champion_moved_companies,
        }),
      }),
    );
    expect(db.repActionPrompt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        careerMovementAlertId: 'ck3234567890123456789012',
      }),
    });
  });
});
