import { SocialPlatform } from '@prisma/client';

import { getLandingPageBySlug } from '@/lib/services';

const platformLabels: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  custom: 'Website',
};

export interface PublicRepLandingPageData {
  slug: string;
  landingPageId: string;
  landingPageTitle: string;
  headline: string;
  subheadline?: string;
  heroCtaText: string;
  metaTitle?: string;
  metaDescription?: string;
  rep: {
    id: string;
    slug: string;
    name: string;
    firstName: string;
    title: string;
    bio: string;
    photoUrl?: string;
    email: string;
    phone?: string;
    website?: string;
    location?: string;
  };
  signature: {
    companyName: string;
    jobTitle?: string;
    primaryPhone?: string;
    email?: string;
    website?: string;
    linkedinUrl?: string;
    calendarUrl?: string;
    address?: string;
  } | null;
  socialLinks: Array<{
    id: string;
    platform: SocialPlatform;
    label: string;
    displayLabel: string;
    href: string;
  }>;
  callHref?: string;
  emailHref: string;
  websiteHref?: string;
  saveContactHref: string;
  leadCaptureHref: string;
  leadCtaLabel: string;
}

export function formatSocialLink({
  id,
  platform,
  label,
  url,
}: {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
}) {
  return {
    id,
    platform,
    label,
    displayLabel: label || platformLabels[platform],
    href: url,
  };
}

export async function getPublicRepLandingPageData(slug: string) {
  const landingPage = await getLandingPageBySlug(slug);

  if (!landingPage || !landingPage.repProfile) {
    return null;
  }

  return {
    slug: landingPage.slug,
    landingPageId: landingPage.id,
    landingPageTitle: landingPage.title,
    headline: landingPage.headline,
    subheadline: landingPage.subheadline ?? undefined,
    heroCtaText: landingPage.heroCtaText,
    metaTitle: landingPage.metaTitle ?? undefined,
    metaDescription: landingPage.metaDescription ?? undefined,
    rep: {
      id: landingPage.repProfile.id,
      slug: landingPage.repProfile.slug,
      name: landingPage.repProfile.displayName,
      firstName: landingPage.repProfile.firstName,
      title: landingPage.repProfile.title,
      bio: landingPage.repProfile.bio,
      photoUrl: landingPage.repProfile.photoUrl ?? undefined,
      email: landingPage.repProfile.email,
      phone: landingPage.repProfile.phone ?? undefined,
      website: landingPage.repProfile.website ?? undefined,
      location: landingPage.repProfile.location ?? undefined,
    },
    signature: landingPage.repProfile.signatureProfile
      ? {
          companyName: landingPage.repProfile.signatureProfile.companyName,
          jobTitle: landingPage.repProfile.signatureProfile.jobTitle ?? undefined,
          primaryPhone:
            landingPage.repProfile.signatureProfile.primaryPhone ?? undefined,
          email: landingPage.repProfile.signatureProfile.email ?? undefined,
          website: landingPage.repProfile.signatureProfile.website ?? undefined,
          linkedinUrl:
            landingPage.repProfile.signatureProfile.linkedinUrl ?? undefined,
          calendarUrl:
            landingPage.repProfile.signatureProfile.calendarUrl ?? undefined,
          address: landingPage.repProfile.signatureProfile.address ?? undefined,
        }
      : null,
    socialLinks: landingPage.repProfile.socialLinks.map(formatSocialLink),
    callHref: landingPage.repProfile.phone
      ? `tel:${landingPage.repProfile.phone}`
      : landingPage.repProfile.signatureProfile?.primaryPhone
        ? `tel:${landingPage.repProfile.signatureProfile.primaryPhone}`
        : undefined,
    emailHref: `mailto:${landingPage.repProfile.email}`,
    websiteHref:
      landingPage.repProfile.website ??
      landingPage.repProfile.signatureProfile?.website ??
      undefined,
    saveContactHref: `/api/rep/${landingPage.slug}/vcard`,
    leadCaptureHref: '/api/public/leads',
    leadCtaLabel: 'Request Info',
  } satisfies PublicRepLandingPageData;
}
