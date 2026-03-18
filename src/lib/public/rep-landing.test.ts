import { SocialPlatform } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { formatSocialLink, getPublicRepLandingPageData } from './rep-landing';

vi.mock('@/lib/services', () => ({
  getLandingPageBySlug: vi.fn(),
}));

import { getLandingPageBySlug } from '@/lib/services';

describe('public rep landing formatter', () => {
  it('formats a social link for public display', () => {
    expect(
      formatSocialLink({
        id: 'social_1',
        platform: SocialPlatform.linkedin,
        label: 'LinkedIn',
        url: 'https://linkedin.com/in/jay-jones',
      }),
    ).toEqual({
      id: 'social_1',
      platform: SocialPlatform.linkedin,
      label: 'LinkedIn',
      displayLabel: 'LinkedIn',
      href: 'https://linkedin.com/in/jay-jones',
    });
  });

  it('returns null when the slug does not resolve', async () => {
    vi.mocked(getLandingPageBySlug).mockResolvedValueOnce(null);

    await expect(getPublicRepLandingPageData('missing-rep')).resolves.toBeNull();
  });

  it('shapes public landing page data from the landing page record', async () => {
    vi.mocked(getLandingPageBySlug).mockResolvedValueOnce({
      id: 'ck1234567890123456789012',
      slug: 'jay-jones',
      title: 'Jay Jones | Trainovations',
      headline: 'Connect with Jay Jones',
      subheadline: 'Transit training support.',
      heroCtaText: 'Save Contact',
      metaTitle: 'Jay Jones - Trainovations',
      metaDescription: 'Public landing page',
      repProfile: {
        id: 'rep_1',
        slug: 'jay-jones',
        displayName: 'Jay Jones',
        firstName: 'Jay',
        title: 'Safety Technology Specialist',
        bio: 'Bio goes here.',
        photoUrl: 'https://example.com/jay.jpg',
        email: 'jay.jones@trainovations.com',
        phone: '555-101-2201',
        website: 'https://trainovations.com/jay-jones',
        location: 'Phoenix, Arizona',
        signatureProfile: {
          companyName: 'Trainovations',
          jobTitle: 'Safety Technology Specialist',
          primaryPhone: '555-101-2201',
          email: 'jay.jones@trainovations.com',
          website: 'https://trainovations.com',
          linkedinUrl: 'https://linkedin.com/in/jay-jones',
          calendarUrl: 'https://cal.com/jay-jones',
          address: 'Phoenix',
        },
        socialLinks: [
          {
            id: 'social_1',
            platform: SocialPlatform.linkedin,
            label: 'LinkedIn',
            url: 'https://linkedin.com/in/jay-jones',
          },
        ],
      },
    } as never);

    const result = await getPublicRepLandingPageData('jay-jones');

    expect(result).toMatchObject({
      slug: 'jay-jones',
      rep: {
        name: 'Jay Jones',
      },
      landingPageId: 'ck1234567890123456789012',
      callHref: 'tel:555-101-2201',
      emailHref: 'mailto:jay.jones@trainovations.com',
      saveContactHref: '/api/rep/jay-jones/vcard',
      leadCaptureHref: '/api/public/leads',
    });
  });
});
