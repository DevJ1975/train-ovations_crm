import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/public/rep-landing', () => ({
  getPublicRepLandingPageData: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}));

import RepLandingPage, { generateMetadata } from './page';
import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';

describe('RepLandingPage route', () => {
  it('returns metadata for a valid public landing page', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce({
      landingPageTitle: 'Jay Jones | Trainovations',
      metaTitle: 'Jay Jones - Trainovations',
      metaDescription: 'Public landing page',
    } as never);

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: 'jay-jones' }),
      }),
    ).resolves.toEqual({
      title: 'Jay Jones - Trainovations',
      description: 'Public landing page',
    });
  });

  it('invokes notFound for invalid slugs', async () => {
    vi.mocked(getPublicRepLandingPageData).mockResolvedValueOnce(null);

    await expect(
      RepLandingPage({
        params: Promise.resolve({ slug: 'missing' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mocks.notFound).toHaveBeenCalled();
  });
});
