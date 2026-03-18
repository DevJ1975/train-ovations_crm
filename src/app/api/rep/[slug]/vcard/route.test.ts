import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/public/rep-landing', () => ({
  getPublicRepLandingPageData: vi.fn(),
}));

vi.mock('@/lib/public/vcard', () => ({
  buildVCardFromRepProfile: vi.fn(),
  getVCardFilename: vi.fn(() => 'jay-jones.vcf'),
}));

import { GET } from './route';
import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';
import { buildVCardFromRepProfile } from '@/lib/public/vcard';

describe('GET /api/rep/[slug]/vcard', () => {
  it('returns a downloadable vCard response for a valid slug', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce({
      slug: 'jay-jones',
    } as never);
    vi.mocked(buildVCardFromRepProfile).mockReturnValueOnce(
      'BEGIN:VCARD\nFN:Jay Jones\nEND:VCARD',
    );

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'jay-jones' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/vcard');
    expect(response.headers.get('content-disposition')).toContain(
      'attachment; filename="jay-jones.vcf"',
    );
    await expect(response.text()).resolves.toContain('BEGIN:VCARD');
  });

  it('returns 404 for an invalid slug', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'missing' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: 'Rep not found.',
    });
  });
});
