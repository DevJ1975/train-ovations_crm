import { describe, expect, it } from 'vitest';

import { buildVCardFromRepProfile, getVCardFilename } from './vcard';

const publicRepData = {
  slug: 'jay-jones',
  landingPageId: 'page_1',
  landingPageTitle: 'Jay Jones | Trainovations',
  headline: 'Connect with Jay Jones',
  heroCtaText: 'Save Contact',
  rep: {
    id: 'rep_1',
    slug: 'jay-jones',
    name: 'Jay Jones',
    firstName: 'Jay',
    title: 'Safety Technology Specialist',
    bio: 'Bio',
    email: 'jay.jones@trainovations.com',
    phone: '555-101-2201',
  },
  signature: {
    companyName: 'Trainovations',
    jobTitle: 'Safety Technology Specialist',
    primaryPhone: '555-101-2201',
    email: 'jay.jones@trainovations.com',
    website: 'https://trainovations.com',
    linkedinUrl: 'https://linkedin.com/in/jay-jones',
  },
  socialLinks: [
    {
      id: 'social_1',
      platform: 'linkedin' as const,
      label: 'LinkedIn',
      displayLabel: 'LinkedIn',
      href: 'https://linkedin.com/in/jay-jones',
    },
    {
      id: 'social_2',
      platform: 'custom' as const,
      label: 'Book Time',
      displayLabel: 'Book Time',
      href: 'https://cal.com/jay-jones',
    },
  ],
  emailHref: 'mailto:jay.jones@trainovations.com',
  saveContactHref: '/api/rep/jay-jones/vcard',
  leadCaptureHref: '/api/public/leads',
  leadCtaLabel: 'Request Info',
};

describe('vCard formatter', () => {
  it('builds a valid vCard with core contact fields', () => {
    const result = buildVCardFromRepProfile(publicRepData);

    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('VERSION:3.0');
    expect(result).toContain('FN:Jay Jones');
    expect(result).toContain('ORG:Trainovations');
    expect(result).toContain('TITLE:Safety Technology Specialist');
    expect(result).toContain('TEL;TYPE=WORK,VOICE:555-101-2201');
    expect(result).toContain('EMAIL;TYPE=INTERNET,WORK:jay.jones@trainovations.com');
    expect(result).toContain('URL;TYPE=WORK:https://trainovations.com');
  });

  it('includes LinkedIn and additional labeled links when available', () => {
    const result = buildVCardFromRepProfile(publicRepData);

    expect(result).toContain('item1.URL:https://linkedin.com/in/jay-jones');
    expect(result).toContain('item1.X-ABLabel:LinkedIn');
    expect(result).toContain('item2.URL:https://cal.com/jay-jones');
    expect(result).toContain('item2.X-ABLabel:Book Time');
  });

  it('builds a deterministic filename', () => {
    expect(getVCardFilename('jay-jones')).toBe('jay-jones.vcf');
  });
});
