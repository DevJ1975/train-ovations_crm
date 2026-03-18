import { LeadNoteSourceType, LeadStatus, SocialPlatform, SourceType } from '@prisma/client';
import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(80, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only');

const optionalUrlSchema = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined);

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone number is too long')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const repProfileBaseSchema = z.object({
  userId: z.string().cuid('User id must be a valid cuid'),
  slug: slugSchema,
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  displayName: z.string().trim().min(1, 'Display name is required').max(120),
  title: z.string().trim().min(1, 'Title is required').max(120),
  bio: z.string().trim().min(20, 'Bio must be at least 20 characters').max(2000),
  photoUrl: optionalUrlSchema,
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalPhoneSchema,
  website: optionalUrlSchema,
  location: optionalTextSchema(120),
  isActive: z.boolean().optional().default(true),
});

export const createRepProfileSchema = repProfileBaseSchema;
export const updateRepProfileSchema = repProfileBaseSchema.partial().extend({
  userId: z.string().cuid().optional(),
  slug: slugSchema.optional(),
});

export const updateRepProfileBasicSchema = updateRepProfileSchema.pick({
  displayName: true,
  title: true,
  bio: true,
  email: true,
  phone: true,
  website: true,
  location: true,
  isActive: true,
});

export const signatureProfileBaseSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(120),
  jobTitle: optionalTextSchema(120),
  primaryPhone: optionalPhoneSchema,
  secondaryPhone: optionalPhoneSchema,
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  website: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  calendarUrl: optionalUrlSchema,
  address: optionalTextSchema(240),
});

export const createSignatureProfileSchema = signatureProfileBaseSchema.extend({
  repProfileId: z.string().cuid('Rep profile id must be a valid cuid'),
});

export const updateSignatureProfileSchema = signatureProfileBaseSchema.partial();

export const socialLinkBaseSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  label: z.string().trim().min(1, 'Label is required').max(80),
  url: z.string().trim().url('Enter a valid URL'),
  sortOrder: z.number().int().min(0).max(100).optional().default(0),
});

export const createSocialLinkSchema = socialLinkBaseSchema.extend({
  repProfileId: z.string().cuid('Rep profile id must be a valid cuid'),
});

export const updateSocialLinkSchema = socialLinkBaseSchema.partial();

export const landingPageBaseSchema = z.object({
  repProfileId: z.string().cuid('Rep profile id must be a valid cuid'),
  slug: slugSchema,
  title: z.string().trim().min(1, 'Title is required').max(140),
  headline: z.string().trim().min(1, 'Headline is required').max(180),
  subheadline: optionalTextSchema(240),
  heroCtaText: z.string().trim().min(1, 'CTA text is required').max(80),
  metaTitle: optionalTextSchema(160),
  metaDescription: optionalTextSchema(240),
  isPublished: z.boolean().optional().default(true),
});

export const createLandingPageSchema = landingPageBaseSchema;
export const updateLandingPageSchema = landingPageBaseSchema.partial().extend({
  repProfileId: z.string().cuid().optional(),
  slug: slugSchema.optional(),
});

export const createLeadSchema = z.object({
  repProfileId: z.string().cuid().optional(),
  landingPageId: z.string().cuid().optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  company: optionalTextSchema(120),
  jobTitle: optionalTextSchema(120),
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalPhoneSchema,
  location: optionalTextSchema(120),
  industry: optionalTextSchema(120),
  interest: optionalTextSchema(240),
  notes: optionalTextSchema(2000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required' }),
  }),
  status: z.nativeEnum(LeadStatus).optional().default(LeadStatus.new),
  sourceType: z.nativeEnum(SourceType).optional().default(SourceType.landing_page),
  queryParams: z.record(z.string(), z.string()).optional(),
  duplicateOfLeadId: z.string().cuid().optional(),
  submittedAt: z.coerce.date().optional(),
});

export const createManualLeadSchema = createLeadSchema.omit({
  repProfileId: true,
  landingPageId: true,
  sourceType: true,
  queryParams: true,
  duplicateOfLeadId: true,
  submittedAt: true,
});

export const updateManualLeadSchema = createManualLeadSchema;

export const createPublicLeadSubmissionSchema = z.object({
  repSlug: slugSchema,
  landingPageId: z.string().cuid('Landing page id must be a valid cuid'),
  submittedAt: z.string().datetime().optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  company: optionalTextSchema(120),
  jobTitle: optionalTextSchema(120),
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalPhoneSchema,
  industry: optionalTextSchema(120),
  interest: optionalTextSchema(240),
  notes: optionalTextSchema(2000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required' }),
  }),
  queryParams: z.record(z.string(), z.string()).optional(),
  companyEmailWebsite: z.string().optional().default(''),
});

export const createLeadNoteSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  authorId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  callSummaryId: z.string().cuid().optional(),
  sourceType: z
    .nativeEnum(LeadNoteSourceType)
    .optional()
    .default(LeadNoteSourceType.user_authored),
  content: z.string().trim().min(1, 'Note content is required').max(2000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateRepProfileInput = z.infer<typeof createRepProfileSchema>;
export type UpdateRepProfileInput = z.infer<typeof updateRepProfileSchema>;
export type UpdateRepProfileBasicInput = z.infer<typeof updateRepProfileBasicSchema>;
export type CreateSignatureProfileInput = z.infer<typeof createSignatureProfileSchema>;
export type UpdateSignatureProfileInput = z.infer<typeof updateSignatureProfileSchema>;
export type CreateSocialLinkInput = z.infer<typeof createSocialLinkSchema>;
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkSchema>;
export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>;
export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateManualLeadInput = z.infer<typeof createManualLeadSchema>;
export type UpdateManualLeadInput = z.infer<typeof updateManualLeadSchema>;
export type CreateLeadNoteInput = z.infer<typeof createLeadNoteSchema>;
export type CreatePublicLeadSubmissionInput = z.infer<
  typeof createPublicLeadSubmissionSchema
>;

export const createRepJournalEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Title must be 200 characters or fewer')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  body: z
    .string()
    .trim()
    .min(1, 'Entry cannot be empty')
    .max(20000, 'Entry is too long'),
});

export type CreateRepJournalEntryInput = z.infer<typeof createRepJournalEntrySchema>;
