import { z } from 'zod';

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined);

const optionalDateSchema = z.coerce.date().optional();

const jsonRecordSchema = z.record(z.string(), z.unknown()).optional();

const outreachDraftTypeSchema = z.enum([
  'lead_follow_up',
  'post_meeting_follow_up',
  'reconnect',
  'congratulatory',
  'reentry',
  'champion_recovery',
  'proposal_reminder',
]);

const outreachDraftStatusSchema = z.enum([
  'generated',
  'reviewed',
  'edited',
  'approved',
  'archived',
  'sent',
]);

const briefStatusSchema = z.enum([
  'generated',
  'reviewed',
  'edited',
  'approved',
  'archived',
]);

const briefTypeSchema = z.enum(['account', 'contact']);

const priorityEntityTypeSchema = z.enum(['lead', 'account', 'contact', 'opportunity']);

const priorityBandSchema = z.enum(['critical', 'high', 'medium', 'low']);

const repTaskSuggestionTypeSchema = z.enum([
  'send_follow_up',
  'reconnect_contact',
  'review_account_brief',
  'update_champion_status',
  'schedule_check_in',
  'send_proposal_reminder',
  'revive_opportunity',
  'verify_company_change',
]);

const repTaskSuggestionStatusSchema = z.enum([
  'generated',
  'acknowledged',
  'dismissed',
  'converted',
  'archived',
]);

const alertPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const outreachDraftSchema = z.object({
  generatedByUserId: z.string().cuid().optional(),
  lastEditedByUserId: z.string().cuid().optional(),
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  sourceEmailDraftId: z.string().cuid().optional(),
  type: outreachDraftTypeSchema.optional().default('lead_follow_up'),
  status: outreachDraftStatusSchema.optional().default('generated'),
  subject: z.string().trim().min(1, 'Subject is required').max(240),
  bodyText: z.string().trim().min(1, 'Draft body is required').max(20000),
  recipientEmail: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  toneStyle: optionalTextSchema(80),
  suggestedCta: optionalTextSchema(280),
  explanation: optionalTextSchema(1200),
  confidenceScore: z.number().min(0).max(1).optional(),
  generatedAt: optionalDateSchema,
  approvedAt: optionalDateSchema,
  archivedAt: optionalDateSchema,
  sentAt: optionalDateSchema,
  generationProvider: optionalTextSchema(120),
  modelName: optionalTextSchema(120),
  sourceContext: jsonRecordSchema,
  generationMetadata: jsonRecordSchema,
});

export const draftGenerationContextSchema = z.object({
  outreachDraftId: z.string().cuid('Outreach draft id must be a valid cuid'),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  repProfileId: z.string().cuid().optional(),
  sourceEntityType: z.string().trim().min(1, 'Source entity type is required').max(80),
  sourceEntityId: z.string().trim().min(1, 'Source entity id is required').max(191),
  contextSummary: optionalTextSchema(1200),
  contextSnapshot: jsonRecordSchema,
  explanationData: jsonRecordSchema,
});

export const accountBriefSchema = z.object({
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  latestRunId: z.string().cuid().optional(),
  status: briefStatusSchema.optional().default('generated'),
  companyName: z.string().trim().min(1, 'Company name is required').max(180),
  summary: z.string().trim().min(1, 'Summary is required').max(4000),
  companyOverview: optionalTextSchema(2000),
  keyContactsSummary: optionalTextSchema(2000),
  championSummary: optionalTextSchema(1200),
  movementSummary: optionalTextSchema(1200),
  opportunityThemes: z.array(z.string().trim().min(1).max(280)).max(12).optional(),
  recentActivity: z.array(z.string().trim().min(1).max(280)).max(12).optional(),
  openActionItems: z.array(z.string().trim().min(1).max(280)).max(12).optional(),
  recommendedNextStep: optionalTextSchema(500),
  explanation: optionalTextSchema(1200),
  confidenceScore: z.number().min(0).max(1).optional(),
  generationProvider: optionalTextSchema(120),
  modelName: optionalTextSchema(120),
  generatedAt: optionalDateSchema,
  reviewedAt: optionalDateSchema,
  approvedAt: optionalDateSchema,
  sourceContext: jsonRecordSchema,
  generationMetadata: jsonRecordSchema,
});

export const contactBriefSchema = z.object({
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  meetingId: z.string().cuid().optional(),
  latestRunId: z.string().cuid().optional(),
  status: briefStatusSchema.optional().default('generated'),
  summary: z.string().trim().min(1, 'Summary is required').max(3000),
  roleSummary: optionalTextSchema(1200),
  relationshipSummary: optionalTextSchema(1600),
  movementSummary: optionalTextSchema(1200),
  suggestedApproach: optionalTextSchema(800),
  outreachTiming: optionalTextSchema(240),
  recommendedNextStep: optionalTextSchema(500),
  explanation: optionalTextSchema(1200),
  confidenceScore: z.number().min(0).max(1).optional(),
  generationProvider: optionalTextSchema(120),
  modelName: optionalTextSchema(120),
  generatedAt: optionalDateSchema,
  reviewedAt: optionalDateSchema,
  approvedAt: optionalDateSchema,
  sourceContext: jsonRecordSchema,
  generationMetadata: jsonRecordSchema,
});

export const briefGenerationRunSchema = z.object({
  actorUserId: z.string().cuid().optional(),
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  accountBriefId: z.string().cuid().optional(),
  contactBriefId: z.string().cuid().optional(),
  briefType: briefTypeSchema,
  status: briefStatusSchema.optional().default('generated'),
  inputContext: jsonRecordSchema,
  outputSummary: optionalTextSchema(2000),
  explanation: optionalTextSchema(1200),
  confidenceScore: z.number().min(0).max(1).optional(),
  generationProvider: optionalTextSchema(120),
  modelName: optionalTextSchema(120),
  generatedAt: optionalDateSchema,
});

export const priorityScoreSchema = z.object({
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  entityType: priorityEntityTypeSchema,
  entityKey: z.string().trim().min(1, 'Entity key is required').max(191),
  score: z.number().int().min(0).max(100),
  band: priorityBandSchema,
  explanation: optionalTextSchema(1200),
  reasonSummary: optionalTextSchema(1200),
  sourceConfidence: z.number().min(0).max(1).optional(),
  lastEvaluatedAt: z.coerce.date(),
});

export const priorityReasonSchema = z.object({
  priorityScoreId: z.string().cuid('Priority score id must be a valid cuid'),
  code: z.string().trim().min(1, 'Reason code is required').max(80),
  label: z.string().trim().min(1, 'Reason label is required').max(140),
  description: optionalTextSchema(600),
  weight: z.number().int().min(-100).max(100).optional().default(0),
  sourceContext: jsonRecordSchema,
});

export const repTaskSuggestionSchema = z.object({
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  careerMovementAlertId: z.string().cuid().optional(),
  expansionOpportunitySignalId: z.string().cuid().optional(),
  repActionPromptId: z.string().cuid().optional(),
  priorityScoreId: z.string().cuid().optional(),
  type: repTaskSuggestionTypeSchema,
  status: repTaskSuggestionStatusSchema.optional().default('generated'),
  priority: alertPrioritySchema.optional().default('medium'),
  title: z.string().trim().min(1, 'Title is required').max(180),
  reason: z.string().trim().min(1, 'Reason is required').max(1200),
  explanation: optionalTextSchema(1200),
  recommendedDueAt: optionalDateSchema,
  confidenceScore: z.number().min(0).max(1).optional(),
  sourceContext: jsonRecordSchema,
});

export type OutreachDraftInput = z.infer<typeof outreachDraftSchema>;
export type DraftGenerationContextInput = z.infer<typeof draftGenerationContextSchema>;
export type AccountBriefInput = z.infer<typeof accountBriefSchema>;
export type ContactBriefInput = z.infer<typeof contactBriefSchema>;
export type BriefGenerationRunInput = z.infer<typeof briefGenerationRunSchema>;
export type PriorityScoreInput = z.infer<typeof priorityScoreSchema>;
export type PriorityReasonInput = z.infer<typeof priorityReasonSchema>;
export type RepTaskSuggestionInput = z.infer<typeof repTaskSuggestionSchema>;
