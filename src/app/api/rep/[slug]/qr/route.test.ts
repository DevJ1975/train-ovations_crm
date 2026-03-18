import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/public/rep-landing', () => ({
  getPublicRepLandingPageData: vi.fn(),
}));

vi.mock('@/lib/qr/qr-code-service', () => ({
  QrCodeService: {
    toSvgString: vi.fn(),
  },
}));

import { GET } from './route';
import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';
import { QrCodeService } from '@/lib/qr/qr-code-service';

describe('GET /api/rep/[slug]/qr', () => {
  it('returns an SVG QR code for a valid rep slug', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce({
      slug: 'jay-jones',
      rep: {
        slug: 'jay-jones',
      },
    } as never);
    vi.mocked(QrCodeService.toSvgString).mockResolvedValueOnce('<svg>qr</svg>');

    const response = await GET(new Request('http://localhost:3004/api/rep/jay-jones/qr'), {
      params: Promise.resolve({ slug: 'jay-jones' }),
    });

    expect(QrCodeService.toSvgString).toHaveBeenCalledWith(
      'http://localhost:3004/rep/jay-jones',
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(response.headers.get('content-disposition')).toContain('jay-jones-qr.svg');
    await expect(response.text()).resolves.toContain('<svg>qr</svg>');
  });

  it('returns 404 for an invalid slug', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost:3004/api/rep/missing/qr'), {
      params: Promise.resolve({ slug: 'missing' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: 'Rep not found.',
    });
  });
});
