import { z } from 'zod';

// ─── Block Content Schemas ────────────────────────────────────────────────────

export const heroBlockContentSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(500).optional(),
  backgroundImageUrl: z.string().url().optional().or(z.literal('')),
  ctaText: z.string().max(80).optional(),
  ctaScrollToBlockType: z.string().optional(),
});

export const richTextBlockContentSchema = z.object({
  html: z.string(),
});

export const imageBlockContentSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(300).optional(),
  altText: z.string().max(200).optional(),
  width: z.enum(['full', 'large', 'medium']).default('full'),
});

export const galleryBlockContentSchema = z.object({
  images: z.array(
    z.object({ url: z.string().url(), caption: z.string().optional(), altText: z.string().optional() }),
  ).min(1).max(20),
  layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
});

export const videoBlockContentSchema = z.object({
  videoUrl: z.string().url(),
  caption: z.string().max(300).optional(),
  autoplay: z.boolean().default(false),
});

export const testimonialBlockContentSchema = z.object({
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(100),
  authorTitle: z.string().max(100).optional(),
  authorCompany: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).optional(),
});

export const problemSolutionBlockContentSchema = z.object({
  problemTitle: z.string().min(1).max(200),
  problemDescription: z.string().min(1).max(2000),
  solutionTitle: z.string().min(1).max(200),
  solutionDescription: z.string().min(1).max(2000),
});

export const deliverablesBlockContentSchema = z.object({
  items: z.array(
    z.object({ title: z.string().min(1).max(200), description: z.string().max(500).optional(), icon: z.string().optional() }),
  ).min(1).max(30),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
});

export const scopeBlockContentSchema = z.object({
  included: z.array(z.string().min(1).max(300)).min(1).max(30),
  excluded: z.array(z.string().min(1).max(300)).max(20).optional(),
});

export const timelineBlockContentSchema = z.object({
  phases: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      duration: z.string().max(50).optional(),
      startOffset: z.string().max(50).optional(),
    }),
  ).min(1).max(20),
});

export const faqBlockContentSchema = z.object({
  items: z.array(
    z.object({ question: z.string().min(1).max(300), answer: z.string().min(1).max(2000) }),
  ).min(1).max(30),
});

export const pricingTableBlockContentSchema = z.object({
  showComparison: z.boolean().default(false),
  highlight: z.string().optional(),
});

export const packageSelectorBlockContentSchema = z.object({
  allowMultiple: z.boolean().default(false),
  instruction: z.string().max(300).optional(),
});

export const addOnsBlockContentSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

export const roiBlockContentSchema = z.object({
  headline: z.string().min(1).max(300),
  metrics: z.array(
    z.object({
      label: z.string().min(1).max(100),
      value: z.string().min(1).max(100),
      description: z.string().max(300).optional(),
    }),
  ).min(1).max(12),
});

export const ctaBlockContentSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(500).optional(),
  buttonText: z.string().min(1).max(80),
  buttonAction: z.enum(['scroll_to_signature', 'scroll_to_payment', 'scroll_to_scheduling', 'external_url']),
  buttonUrl: z.string().url().optional().or(z.literal('')),
});

export const signatureBlockContentSchema = z.object({
  instruction: z.string().max(500).optional(),
  requireFullName: z.boolean().default(true),
  requireTitle: z.boolean().default(false),
  requireDate: z.boolean().default(true),
  agreementText: z.string().max(2000).optional(),
});

export const paymentBlockContentSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  showPackageSummary: z.boolean().default(true),
});

export const schedulingBlockContentSchema = z.object({
  heading: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  schedulingUrl: z.string().url().optional().or(z.literal('')),
  embedType: z.enum(['link', 'iframe']).default('link'),
});

// ─── Block Content Union ──────────────────────────────────────────────────────

export const blockContentByType = {
  hero: heroBlockContentSchema,
  rich_text: richTextBlockContentSchema,
  image: imageBlockContentSchema,
  gallery: galleryBlockContentSchema,
  video_embed: videoBlockContentSchema,
  testimonial: testimonialBlockContentSchema,
  problem_solution: problemSolutionBlockContentSchema,
  deliverables: deliverablesBlockContentSchema,
  scope: scopeBlockContentSchema,
  timeline: timelineBlockContentSchema,
  faq: faqBlockContentSchema,
  pricing_table: pricingTableBlockContentSchema,
  package_selector: packageSelectorBlockContentSchema,
  add_ons: addOnsBlockContentSchema,
  roi_value: roiBlockContentSchema,
  cta: ctaBlockContentSchema,
  signature: signatureBlockContentSchema,
  payment: paymentBlockContentSchema,
  scheduling: schedulingBlockContentSchema,
} as const;

export type BlockType = keyof typeof blockContentByType;

// ─── Proposal CRUD ────────────────────────────────────────────────────────────

export const createProposalSchema = z.object({
  title: z.string().min(1).max(300),
  leadId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  templateId: z.string().cuid().optional(),
  clientName: z.string().max(200).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientCompany: z.string().max(200).optional(),
  useBlockEngine: z.boolean().default(true),
});

export const updateProposalMetaSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  clientName: z.string().max(200).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientCompany: z.string().max(200).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal('')),
  fontFamily: z.string().max(100).optional(),
  footerText: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  schedulingUrl: z.string().url().optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional(),
  paymentType: z.enum(['none', 'full', 'deposit']).optional(),
  depositPercent: z.number().int().min(1).max(99).optional(),
  totalValueCents: z.number().int().min(0).optional(),
});

// ─── Block CRUD ───────────────────────────────────────────────────────────────

export const createBlockSchema = z.object({
  blockType: z.enum([
    'hero', 'rich_text', 'image', 'gallery', 'video_embed', 'testimonial',
    'problem_solution', 'deliverables', 'scope', 'timeline', 'faq',
    'pricing_table', 'package_selector', 'add_ons', 'roi_value', 'cta',
    'signature', 'payment', 'scheduling',
  ]),
  position: z.number().int().min(0).optional(),
  content: z.record(z.unknown()).optional(),
});

export const updateBlockSchema = z.object({
  content: z.record(z.unknown()),
  isVisible: z.boolean().optional(),
});

export const reorderBlocksSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});

// ─── Pricing Packages ─────────────────────────────────────────────────────────

export const createPackageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  isFeatured: z.boolean().default(false),
  features: z.array(z.string().min(1).max(300)).max(20).default([]),
  addOns: z.array(
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      priceCents: z.number().int().min(0),
      isOptional: z.boolean().default(true),
    }),
  ).max(10).optional(),
});

export const updatePackageSchema = createPackageSchema.partial().omit({ addOns: true });

// ─── Templates ────────────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
});

// ─── Client-Facing (Public) ───────────────────────────────────────────────────

export const clientSignSchema = z.object({
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  signerTitle: z.string().max(200).optional(),
  signatureData: z.string().min(1),
});

export const clientAcceptSchema = z.object({
  selectedPackageId: z.string().cuid().optional(),
  selectedAddOnIds: z.array(z.string().cuid()).optional(),
});

export const proposalEventSchema = z.object({
  eventType: z.enum([
    'viewed', 'section_viewed', 'package_selected', 'addon_toggled',
    'signed', 'accepted', 'payment_initiated', 'payment_completed',
    'declined', 'link_clicked', 'scheduling_opened',
  ]),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalMetaInput = z.infer<typeof updateProposalMetaSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type ClientSignInput = z.infer<typeof clientSignSchema>;
export type ClientAcceptInput = z.infer<typeof clientAcceptSchema>;
export type ProposalEventInput = z.infer<typeof proposalEventSchema>;
