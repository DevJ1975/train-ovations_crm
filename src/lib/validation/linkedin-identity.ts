import {
  AlertPriority,
  ChampionPriority,
  ChampionStatus,
  ProfileMatchStatus,
  ProfileSourceType,
  RecordOriginType,
  AlertStatus,
  WatchlistCategory,
  WatchlistPriority,
} from '@prisma/client';
import { z } from 'zod';

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined);

const linkedinProfileUrlSchema = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .refine(
    (value) => /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^/]+\/?$/i.test(value),
    'Enter a valid LinkedIn profile URL',
  );

export const manualLinkedInProfileLinkSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  profileUrl: linkedinProfileUrlSchema,
  confidenceScore: z.number().min(0).max(1).optional().default(0.95),
  humanConfirmed: z.boolean().optional().default(true),
});

export const profileMatchCandidateSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  profileUrl: linkedinProfileUrlSchema,
  fullName: z.string().trim().min(1, 'Full name is required').max(160),
  title: optionalTextSchema(160),
  companyName: optionalTextSchema(160),
  location: optionalTextSchema(160),
  sourceType: z
    .nativeEnum(ProfileSourceType)
    .optional()
    .default(ProfileSourceType.ai_inference),
  confidenceScore: z.number().min(0).max(1),
  matchingSignals: z.record(z.string(), z.unknown()).optional(),
});

export const confirmProfileMatchSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  candidateId: z.string().cuid('Candidate id must be a valid cuid'),
  matchStatus: z
    .nativeEnum(ProfileMatchStatus)
    .optional()
    .default(ProfileMatchStatus.confirmed),
});

export const employmentSnapshotSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  linkedInProfileLinkId: z.string().cuid().optional(),
  title: z.string().trim().min(1, 'Title is required').max(160),
  companyName: z.string().trim().min(1, 'Company name is required').max(160),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().optional().default(true),
  companyPageUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')).transform((value) => value || undefined),
  profileUrl: linkedinProfileUrlSchema.optional().or(z.literal('')).transform((value) => value || undefined),
  sourceType: z.nativeEnum(ProfileSourceType),
  confidenceScore: z.number().min(0).max(1),
  retrievedAt: z.coerce.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const watchlistSettingsSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  isActive: z.boolean().optional().default(true),
  category: z
    .nativeEnum(WatchlistCategory)
    .optional()
    .default(WatchlistCategory.strategic_contact),
  priority: z.nativeEnum(WatchlistPriority).optional().default(WatchlistPriority.normal),
  reason: optionalTextSchema(240),
  notifyOnEmploymentChange: z.boolean().optional().default(true),
  notifyOnTitleChange: z.boolean().optional().default(true),
  notifyOnBrokenLink: z.boolean().optional().default(true),
  notifyOnStaleData: z.boolean().optional().default(true),
  notifyOnTargetCompanyMatch: z.boolean().optional().default(true),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.user_input),
});

export const championFlagSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  ownerRepProfileId: z.string().cuid().optional(),
  isActive: z.boolean().optional().default(true),
  priority: z
    .nativeEnum(ChampionPriority)
    .optional()
    .default(ChampionPriority.medium),
  status: z.nativeEnum(ChampionStatus).optional(),
  rationale: optionalTextSchema(240),
  notes: optionalTextSchema(500),
  confidenceScore: z.number().min(0).max(1).optional().default(0.75),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.user_input),
});

export const careerMovementAlertSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  linkedInProfileLinkId: z.string().cuid().optional(),
  employmentChangeEventId: z.string().cuid().optional(),
  priority: z.nativeEnum(AlertPriority).optional().default(AlertPriority.medium),
  status: z.nativeEnum(AlertStatus).optional(),
  title: z.string().trim().min(1, 'Alert title is required').max(180),
  message: z.string().trim().min(1, 'Alert message is required').max(1000),
  suggestedNextStep: optionalTextSchema(400),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ManualLinkedInProfileLinkInput = z.infer<
  typeof manualLinkedInProfileLinkSchema
>;
export type ProfileMatchCandidateInput = z.infer<typeof profileMatchCandidateSchema>;
export type ConfirmProfileMatchInput = z.infer<typeof confirmProfileMatchSchema>;
export type EmploymentSnapshotInput = z.infer<typeof employmentSnapshotSchema>;
export type WatchlistSettingsInput = z.infer<typeof watchlistSettingsSchema>;
export type ChampionFlagInput = z.infer<typeof championFlagSchema>;
export type CareerMovementAlertInput = z.infer<typeof careerMovementAlertSchema>;
