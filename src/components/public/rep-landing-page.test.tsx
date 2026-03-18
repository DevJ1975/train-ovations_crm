import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicRepLandingPage } from './rep-landing-page';

const data = {
  slug: 'jay-jones',
  landingPageId: 'ck1234567890123456789012',
  landingPageTitle: 'Jay Jones | Trainovations',
  headline: 'Connect with Jay Jones',
  subheadline: 'Transit training support.',
  heroCtaText: 'Save Contact',
  rep: {
    id: 'rep_1',
    slug: 'jay-jones',
    name: 'Jay Jones',
    firstName: 'Jay',
    title: 'Safety Technology Specialist',
    bio: 'Jay helps rail and transit organizations modernize field training and compliance communication.',
    email: 'jay.jones@trainovations.com',
    phone: '555-101-2201',
    website: 'https://trainovations.com/jay-jones',
    location: 'Phoenix, Arizona',
  },
  signature: {
    companyName: 'Trainovations',
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
  callHref: 'tel:555-101-2201',
  emailHref: 'mailto:jay.jones@trainovations.com',
  websiteHref: 'https://trainovations.com/jay-jones',
  saveContactHref: '/api/rep/jay-jones/vcard',
  leadCaptureHref: '/api/public/leads',
  leadCtaLabel: 'Request Info',
};

describe('PublicRepLandingPage', () => {
  it('renders the core rep identity and CTA actions', () => {
    render(<PublicRepLandingPage data={data} />);

    expect(
      screen.getByRole('heading', { name: 'Jay Jones', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute(
      'href',
      'tel:555-101-2201',
    );
    expect(screen.getByRole('link', { name: /save contact/i })).toHaveAttribute(
      'href',
      '/api/rep/jay-jones/vcard',
    );
    expect(screen.getByRole('link', { name: /admin login/i })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Fadmin',
    );
    expect(
      screen.getByRole('button', { name: /request info/i }),
    ).toBeInTheDocument();
  });

  it('renders social links for the public profile', () => {
    render(<PublicRepLandingPage data={data} />);

    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/jay-jones',
    );
    expect(screen.getByRole('link', { name: /book time/i })).toHaveAttribute(
      'href',
      'https://cal.com/jay-jones',
    );
  });
});
