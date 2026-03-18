import { describe, expect, it, vi } from 'vitest';

import { createLandingPage, getLandingPageBySlug } from './landing-page-service';

function createDbMock() {
  return {
    landingPage: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  } as any;
}

describe('landing page service', () => {
  it('creates a landing page and logs it', async () => {
    const db = createDbMock();

    db.landingPage.create.mockResolvedValue({
      id: 'lp_1',
      repProfileId: 'ck1234567890123456789012',
      slug: 'jay-jones',
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });

    const result = await createLandingPage(
      {
        repProfileId: 'ck1234567890123456789012',
        slug: 'jay-jones',
        title: 'Jay Jones',
        headline: 'Meet Jay Jones',
        heroCtaText: 'Save Contact',
        isPublished: true,
      },
      db as never,
    );

    expect(result.slug).toBe('jay-jones');
    expect(db.activityLog.create).toHaveBeenCalled();
  });

  it('looks up a landing page by slug with rep details', async () => {
    const db = createDbMock();

    db.landingPage.findUnique.mockResolvedValue({ id: 'lp_1', slug: 'jay-jones' });

    const result = await getLandingPageBySlug('jay-jones', db as never);

    expect(db.landingPage.findUnique).toHaveBeenCalledWith({
      where: { slug: 'jay-jones' },
      include: expect.any(Object),
    });
    expect(result?.slug).toBe('jay-jones');
  });
});
