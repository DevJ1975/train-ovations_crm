import {
  AlertPriority,
  CompanyAssociationType,
  ContactAssociationStatus,
  ExpansionOpportunityStatus,
  ExpansionOpportunityType,
  ProfileSourceType,
  RecordOriginType,
  RelationshipEdgeType,
  RelationshipMilestoneType,
  RepActionPromptStatus,
  RepActionPromptType,
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

const optionalUrlSchema = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const relationshipMilestoneSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  repProfileId: z.string().cuid().optional(),
  relationshipHistoryId: z.string().cuid().optional(),
  externalProfileSourceId: z.string().cuid().optional(),
  milestoneType: z.nativeEnum(RelationshipMilestoneType),
  title: z.string().trim().min(1, 'Title is required').max(180),
  description: optionalTextSchema(1000),
  occurredAt: z.coerce.date(),
  sourceType: z.nativeEnum(ProfileSourceType).optional(),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const contactCompanyAssociationSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  championFlagId: z.string().cuid().optional(),
  externalProfileSourceId: z.string().cuid().optional(),
  companyName: z.string().trim().min(1, 'Company name is required').max(180),
  companyDomain: optionalTextSchema(160),
  companyLinkedInUrl: optionalUrlSchema,
  associationType: z.nativeEnum(CompanyAssociationType),
  status: z
    .nativeEnum(ContactAssociationStatus)
    .optional()
    .default(ContactAssociationStatus.active),
  isCurrent: z.boolean().optional().default(false),
  isStrategic: z.boolean().optional().default(false),
  sourceType: z.nativeEnum(ProfileSourceType).optional(),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  lastVerifiedAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const expansionOpportunitySignalSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  repProfileId: z.string().cuid().optional(),
  careerMovementAlertId: z.string().cuid().optional(),
  contactCompanyAssociationId: z.string().cuid().optional(),
  employmentChangeEventId: z.string().cuid().optional(),
  opportunityType: z.nativeEnum(ExpansionOpportunityType),
  status: z
    .nativeEnum(ExpansionOpportunityStatus)
    .optional()
    .default(ExpansionOpportunityStatus.open),
  priority: z.nativeEnum(AlertPriority).optional().default(AlertPriority.medium),
  companyName: z.string().trim().min(1, 'Company name is required').max(180),
  title: z.string().trim().min(1, 'Title is required').max(180),
  summary: z.string().trim().min(1, 'Summary is required').max(1200),
  suggestedNextStep: optionalTextSchema(400),
  rationale: optionalTextSchema(600),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const repActionPromptSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  repProfileId: z.string().cuid().optional(),
  careerMovementAlertId: z.string().cuid().optional(),
  expansionOpportunitySignalId: z.string().cuid().optional(),
  promptType: z.nativeEnum(RepActionPromptType),
  status: z
    .nativeEnum(RepActionPromptStatus)
    .optional()
    .default(RepActionPromptStatus.open),
  priority: z.nativeEnum(AlertPriority).optional().default(AlertPriority.medium),
  title: z.string().trim().min(1, 'Title is required').max(180),
  message: z.string().trim().min(1, 'Message is required').max(1200),
  suggestedAction: optionalTextSchema(400),
  dueAt: z.coerce.date().optional(),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const relationshipEdgeSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  repProfileId: z.string().cuid().optional(),
  contactCompanyAssociationId: z.string().cuid().optional(),
  relationshipHistoryId: z.string().cuid().optional(),
  edgeType: z.nativeEnum(RelationshipEdgeType),
  label: z.string().trim().min(1, 'Label is required').max(180),
  sourceType: z.nativeEnum(ProfileSourceType).optional(),
  originType: z
    .nativeEnum(RecordOriginType)
    .optional()
    .default(RecordOriginType.system_generated),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  strengthScore: z.number().min(0).max(1).optional().default(0.5),
  isConfirmed: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RelationshipMilestoneInput = z.infer<typeof relationshipMilestoneSchema>;
export type ContactCompanyAssociationInput = z.infer<
  typeof contactCompanyAssociationSchema
>;
export type ExpansionOpportunitySignalInput = z.infer<
  typeof expansionOpportunitySignalSchema
>;
export type RepActionPromptInput = z.infer<typeof repActionPromptSchema>;
export type RelationshipEdgeInput = z.infer<typeof relationshipEdgeSchema>;
