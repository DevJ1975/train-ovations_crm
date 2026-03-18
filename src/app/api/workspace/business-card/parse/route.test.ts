import { describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, parseCard, captureIntegrationError } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  parseCard: vi.fn(),
  captureIntegrationError: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/ocr/business-card-parsing-service', () => ({
  BusinessCardParsingService: {
    parseCard,
  },
}));

vi.mock('@/lib/observability/observability-service', () => ({
  ObservabilityService: {
    captureIntegrationError,
  },
}));

import { POST } from './route';

describe('POST /api/workspace/business-card/parse', () => {
  it('parses an uploaded business card for authenticated users', async () => {
    requireAuthenticatedUser.mockResolvedValueOnce({
      id: 'user_1',
      role: 'sales_rep',
    });
    parseCard.mockResolvedValueOnce({
      rawText: 'Jordan Lee',
      extractedFields: {
        name: { value: 'Jordan Lee', confidence: 'medium' },
      },
    });

    const formData = new FormData();
    formData.set('image', new Blob(['card-bytes'], { type: 'image/png' }), 'card.png');

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      parsedCard: expect.objectContaining({
        rawText: 'Jordan Lee',
      }),
    });
  });

  it('returns 400 when no image is provided', async () => {
    requireAuthenticatedUser.mockResolvedValueOnce({
      id: 'user_1',
      role: 'sales_rep',
    });

    const response = await POST({
      formData: async () => new FormData(),
    } as Request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Business card image is required.',
    });
  });

  it('captures OCR failures and returns 500', async () => {
    requireAuthenticatedUser.mockResolvedValueOnce({
      id: 'user_1',
      role: 'sales_rep',
    });
    parseCard.mockRejectedValueOnce(new Error('ocr failed'));

    const formData = new FormData();
    formData.set('image', new Blob(['card-bytes'], { type: 'image/png' }), 'card.png');

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(captureIntegrationError).toHaveBeenCalledWith(
      'ocr',
      expect.any(Error),
      expect.objectContaining({
        route: '/api/workspace/business-card/parse',
      }),
    );
    expect(response.status).toBe(500);
  });
});
