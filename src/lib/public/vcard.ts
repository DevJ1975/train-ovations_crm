import type { PublicRepLandingPageData } from './rep-landing';

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function findLinkedInUrl(data: PublicRepLandingPageData) {
  return (
    data.signature?.linkedinUrl ??
    data.socialLinks.find((link) => link.platform === 'linkedin')?.href
  );
}

function buildLabeledUrlLines(url: string, label: string, index: number) {
  return [
    `item${index}.URL:${escapeVCardValue(url)}`,
    `item${index}.X-ABLabel:${escapeVCardValue(label)}`,
  ];
}

export function buildVCardFromRepProfile(data: PublicRepLandingPageData) {
  const company = data.signature?.companyName ?? 'Trainovations';
  const title = data.signature?.jobTitle ?? data.rep.title;
  const phone = data.signature?.primaryPhone ?? data.rep.phone;
  const email = data.signature?.email ?? data.rep.email;
  const website = data.signature?.website ?? data.rep.website ?? data.websiteHref;
  const linkedInUrl = findLinkedInUrl(data);

  const additionalLinks = data.socialLinks
    .filter((link) => link.href !== linkedInUrl && link.href !== website)
    .slice(0, 2);

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(data.rep.name)}`,
    `N:${escapeVCardValue(data.rep.name.split(' ').slice(1).join(' ') || data.rep.name)};${escapeVCardValue(data.rep.firstName)};;;`,
    `ORG:${escapeVCardValue(company)}`,
    `TITLE:${escapeVCardValue(title)}`,
    phone ? `TEL;TYPE=WORK,VOICE:${escapeVCardValue(phone)}` : '',
    `EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(email)}`,
    website ? `URL;TYPE=WORK:${escapeVCardValue(website)}` : '',
    linkedInUrl ? buildLabeledUrlLines(linkedInUrl, 'LinkedIn', 1).join('\n') : '',
    ...additionalLinks.flatMap((link, index) =>
      buildLabeledUrlLines(link.href, link.displayLabel, index + 2),
    ),
    'END:VCARD',
  ].filter(Boolean);

  return lines.join('\n');
}

export function getVCardFilename(slug: string) {
  return `${slug}.vcf`;
}
