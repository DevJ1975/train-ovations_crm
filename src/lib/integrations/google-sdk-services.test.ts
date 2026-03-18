import { describe, expect, it, vi } from 'vitest';

const mockListLabels = vi.fn();
const mockListCalendars = vi.fn();
const mockListFiles = vi.fn();

vi.mock('./google-client-factory', () => ({
  GoogleClientFactory: {
    createGmailClient: () => ({
      users: {
        labels: {
          list: mockListLabels,
        },
      },
    }),
    createCalendarClient: () => ({
      calendarList: {
        list: mockListCalendars,
      },
    }),
    createDriveClient: () => ({
      files: {
        list: mockListFiles,
      },
    }),
  },
}));

import { GmailService } from './gmail-service';
import { GoogleCalendarService } from './google-calendar-service';
import { GoogleDriveService } from './google-drive-service';

describe('Google SDK-backed services', () => {
  it('loads Gmail label names through the shared client factory', async () => {
    mockListLabels.mockResolvedValueOnce({
      data: {
        labels: [{ name: 'Inbox' }, { name: 'Trainovations' }],
      },
    });

    const result = await GmailService.listLabelNames({
      accessToken: 'token',
      refreshToken: 'refresh',
    } as never);

    expect(result).toEqual(['Inbox', 'Trainovations']);
  });

  it('loads calendar summaries through the shared client factory', async () => {
    mockListCalendars.mockResolvedValueOnce({
      data: {
        items: [{ id: 'primary', summary: 'Primary' }],
      },
    });

    const result = await GoogleCalendarService.listCalendarSummaries({
      accessToken: 'token',
      refreshToken: 'refresh',
    } as never);

    expect(result).toEqual([{ id: 'primary', summary: 'Primary' }]);
  });

  it('loads recent drive files through the shared client factory', async () => {
    mockListFiles.mockResolvedValueOnce({
      data: {
        files: [{ id: 'file_1', name: 'Deck', webViewLink: 'https://drive.test' }],
      },
    });

    const result = await GoogleDriveService.listRecentFiles({
      accessToken: 'token',
      refreshToken: 'refresh',
    } as never);

    expect(result).toHaveLength(1);
  });
});
