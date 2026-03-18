import { LeadNoteSourceType, LeadStatus, SocialPlatform } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  createLandingPageSchema,
  createLeadNoteSchema,
  createLeadSchema,
  createPublicLeadSubmissionSchema,
  createRepJournalEntrySchema,
  createRepProfileSchema,
  createSignatureProfileSchema,
  createSocialLinkSchema,
} from './crm';

describe('crm validation schemas', () => {
  it('accepts a valid rep profile payload', () => {
    const result = createRepProfileSchema.safeParse({
      userId: 'ck1234567890123456789012',
      slug: 'jay-jones',
      firstName: 'Jay',
      lastName: 'Jones',
      displayName: 'Jay Jones',
      title: 'Safety Technology Specialist',
      bio: 'Experienced Trainovations rep focused on enterprise rail and transit safety programs.',
      email: 'jay.jones@trainovations.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid social links', () => {
    const result = createSocialLinkSchema.safeParse({
      repProfileId: 'ck1234567890123456789012',
      platform: SocialPlatform.linkedin,
      label: '',
      url: 'bad-url',
    });

    expect(result.success).toBe(false);
  });

  it('requires lead consent', () => {
    const result = createLeadSchema.safeParse({
      firstName: 'Alex',
      lastName: 'Stone',
      email: 'alex@company.com',
      consent: false,
    });

    expect(result.success).toBe(false);
  });

  it('allows optional landing page metadata', () => {
    const result = createLandingPageSchema.safeParse({
      repProfileId: 'ck1234567890123456789012',
      slug: 'jay-jones',
      title: 'Jay Jones',
      headline: 'Meet Jay Jones',
      heroCtaText: 'Save Contact',
      isPublished: true,
    });

    expect(result.success).toBe(true);
  });

  it('accepts signature profiles and notes', () => {
    expect(
      createSignatureProfileSchema.safeParse({
        repProfileId: 'ck1234567890123456789012',
        companyName: 'Trainovations',
      }).success,
    ).toBe(true);

    const noteResult = createLeadNoteSchema.parse({
      leadId: 'ck1234567890123456789012',
      content: 'Initial outreach scheduled.',
    });

    expect(noteResult.sourceType).toBe(LeadNoteSourceType.user_authored);
  });

  it('defaults lead status when not supplied', () => {
    const result = createLeadSchema.parse({
      firstName: 'Taylor',
      lastName: 'Brooks',
      email: 'taylor@company.com',
      consent: true,
    });

    expect(result.status).toBe(LeadStatus.new);
  });

  describe('createRepJournalEntrySchema', () => {
    it('accepts a body-only entry (no title)', () => {
      const result = createRepJournalEntrySchema.safeParse({
        body: 'Met with the transit authority district manager today.',
      });
      expect(result.success).toBe(true);
    });

    it('accepts an entry with an optional title', () => {
      const result = createRepJournalEntrySchema.safeParse({
        title: 'Transit meeting',
        body: 'Met with the transit authority district manager today.',
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.title).toBe('Transit meeting');
    });

    it('coerces an empty string title to undefined', () => {
      const result = createRepJournalEntrySchema.parse({
        title: '',
        body: 'Some note.',
      });
      expect(result.title).toBeUndefined();
    });

    it('trims whitespace from body and title', () => {
      const result = createRepJournalEntrySchema.parse({
        title: '  Trimmed  ',
        body: '  Also trimmed  ',
      });
      expect(result.title).toBe('Trimmed');
      expect(result.body).toBe('Also trimmed');
    });

    it('rejects an empty body', () => {
      const result = createRepJournalEntrySchema.safeParse({ body: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a whitespace-only body', () => {
      const result = createRepJournalEntrySchema.safeParse({ body: '   ' });
      expect(result.success).toBe(false);
    });

    it('rejects a title exceeding 200 characters', () => {
      const result = createRepJournalEntrySchema.safeParse({
        title: 'x'.repeat(201),
        body: 'Valid body.',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a body exceeding 20000 characters', () => {
      const result = createRepJournalEntrySchema.safeParse({
        body: 'x'.repeat(20001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts a body at the maximum allowed length', () => {
      const result = createRepJournalEntrySchema.safeParse({
        body: 'x'.repeat(20000),
      });
      expect(result.success).toBe(true);
    });
  });

  it('accepts a public lead submission payload with hidden fields', () => {
    const result = createPublicLeadSubmissionSchema.safeParse({
      repSlug: 'jay-jones',
      landingPageId: 'ck1234567890123456789012',
      submittedAt: '2026-03-13T12:00:00.000Z',
      firstName: 'Taylor',
      lastName: 'Brooks',
      email: 'taylor@company.com',
      consent: true,
      queryParams: {
        utm_source: 'qr',
      },
      companyEmailWebsite: '',
    });

    expect(result.success).toBe(true);
  });
});
