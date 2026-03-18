import { getAnthropicClient } from './client';

export interface ProposalContext {
  rep: {
    displayName: string;
    title: string;
    email: string;
    phone: string | null;
    signatureCompany: string | null;
    signatureJobTitle: string | null;
    signatureWebsite: string | null;
    signatureAddress: string | null;
  };
  lead: {
    firstName: string;
    lastName: string;
    company: string | null;
    jobTitle: string | null;
    email: string;
    interest: string | null;
  } | null;
  account: {
    name: string;
    domain: string | null;
    industry: string | null;
    hqLocation: string | null;
    description: string | null;
  } | null;
  opportunity: {
    name: string;
    stage: string;
    amountCents: number | null;
    targetCloseDate: Date | null;
    description: string | null;
  } | null;
  notes: Array<{
    title: string | null;
    body: string;
    templateType: string;
  }>;
  meetingSummaries: Array<{
    topic: string;
    summary: string | null;
    recommendedNextStep: string | null;
  }>;
}

export interface GeneratedProposal {
  title: string;
  executiveSummary: string;
  aboutUs: string;
  scopeOfWork: string;
  deliverables: string;
  timeline: string;
  pricing: string;
  terms: string;
  nextSteps: string;
  totalValueCents: number | null;
}

function buildContextBlock(ctx: ProposalContext): string {
  const lines: string[] = [];

  lines.push(`## Rep / Sender`);
  lines.push(`Name: ${ctx.rep.displayName}`);
  lines.push(`Title: ${ctx.rep.title}`);
  lines.push(`Email: ${ctx.rep.email}`);
  if (ctx.rep.phone) lines.push(`Phone: ${ctx.rep.phone}`);
  if (ctx.rep.signatureCompany) lines.push(`Company: ${ctx.rep.signatureCompany}`);
  if (ctx.rep.signatureJobTitle) lines.push(`Job title: ${ctx.rep.signatureJobTitle}`);
  if (ctx.rep.signatureWebsite) lines.push(`Website: ${ctx.rep.signatureWebsite}`);
  if (ctx.rep.signatureAddress) lines.push(`Address: ${ctx.rep.signatureAddress}`);

  if (ctx.lead) {
    lines.push(`\n## Prospect / Recipient`);
    lines.push(`Name: ${ctx.lead.firstName} ${ctx.lead.lastName}`);
    lines.push(`Email: ${ctx.lead.email}`);
    if (ctx.lead.company) lines.push(`Company: ${ctx.lead.company}`);
    if (ctx.lead.jobTitle) lines.push(`Title: ${ctx.lead.jobTitle}`);
    if (ctx.lead.interest) lines.push(`Stated interest: ${ctx.lead.interest}`);
  }

  if (ctx.account) {
    lines.push(`\n## Account`);
    lines.push(`Name: ${ctx.account.name}`);
    if (ctx.account.industry) lines.push(`Industry: ${ctx.account.industry}`);
    if (ctx.account.hqLocation) lines.push(`Location: ${ctx.account.hqLocation}`);
    if (ctx.account.description) lines.push(`Description: ${ctx.account.description}`);
  }

  if (ctx.opportunity) {
    lines.push(`\n## Opportunity`);
    lines.push(`Name: ${ctx.opportunity.name}`);
    lines.push(`Stage: ${ctx.opportunity.stage}`);
    if (ctx.opportunity.amountCents != null) {
      lines.push(`Value: $${(ctx.opportunity.amountCents / 100).toLocaleString()}`);
    }
    if (ctx.opportunity.targetCloseDate) {
      lines.push(`Target close: ${ctx.opportunity.targetCloseDate.toDateString()}`);
    }
    if (ctx.opportunity.description) {
      lines.push(`Description / next step: ${ctx.opportunity.description}`);
    }
  }

  if (ctx.notes.length > 0) {
    lines.push(`\n## Rep Notes`);
    for (const note of ctx.notes) {
      if (note.title) lines.push(`### ${note.title} (${note.templateType})`);
      lines.push(note.body);
    }
  }

  if (ctx.meetingSummaries.length > 0) {
    lines.push(`\n## Meeting History`);
    for (const m of ctx.meetingSummaries) {
      lines.push(`### ${m.topic}`);
      if (m.summary) lines.push(m.summary);
      if (m.recommendedNextStep) lines.push(`Recommended next step: ${m.recommendedNextStep}`);
    }
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are a senior sales consultant helping a Trainovations sales rep write a professional business proposal.
Generate a polished, confident proposal tailored to the prospect and context provided.
Write in a professional but warm tone. Be specific — use names, company names, and details from the context.
Do NOT use placeholder text like [Company Name] or [Date]. Use the actual data provided.
Return ONLY a valid JSON object with the exact keys specified. No markdown wrapper, no explanation.`;

const USER_PROMPT_TEMPLATE = (contextBlock: string) => `
Here is the CRM context for this proposal:

${contextBlock}

Generate a complete professional proposal as a JSON object with these exact keys:
{
  "title": "Short proposal title (e.g. 'Trainovations Partnership Proposal for Acme Corp')",
  "executiveSummary": "2-3 paragraph executive summary. Reference the prospect by name, describe the opportunity and why Trainovations is the right partner.",
  "aboutUs": "2 paragraphs about Trainovations and the rep. Use company name, rep title, and any details available. Position as trusted experts.",
  "scopeOfWork": "Detailed scope of work. Use bullet points (markdown). Draw from the opportunity description, notes, and meeting summaries. Be specific about what will be delivered.",
  "deliverables": "Bullet-point list of concrete deliverables. Each on its own line starting with '-'.",
  "timeline": "Proposed project timeline in phases. Use the target close date if available as the engagement start reference. Format as markdown with phase headers.",
  "pricing": "Professional pricing section. Use the opportunity value if available. Format as a markdown table with line items. Include a total. If no value is known, describe the pricing model.",
  "terms": "Standard professional terms: payment terms (Net 30), revision policy (2 rounds), IP ownership, confidentiality, proposal validity (30 days), governing law.",
  "nextSteps": "Clear 3-4 step acceptance and kickoff process. Reference the prospect by name. Include a call to action.",
  "totalValueCents": <integer cents value from opportunity, or null if unknown>
}`;

export async function generateProposalWithAI(
  ctx: ProposalContext,
): Promise<GeneratedProposal> {
  const client = getAnthropicClient();
  const contextBlock = buildContextBlock(ctx);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(contextBlock),
      },
    ],
  });

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  // Strip any accidental markdown code fences
  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  let parsed: GeneratedProposal;

  try {
    parsed = JSON.parse(jsonText) as GeneratedProposal;
  } catch {
    throw new Error(`AI returned invalid JSON. Raw response: ${rawText.slice(0, 200)}`);
  }

  return parsed;
}

export async function regenerateSectionWithAI(
  ctx: ProposalContext,
  sectionKey: keyof Omit<GeneratedProposal, 'totalValueCents'>,
  currentContent: string,
  userInstruction?: string,
): Promise<string> {
  const client = getAnthropicClient();
  const contextBlock = buildContextBlock(ctx);

  const instruction = userInstruction
    ? `The rep has requested: "${userInstruction}"`
    : 'Improve and rewrite this section based on the context.';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is the CRM context:\n\n${contextBlock}\n\n---\n\nSection to rewrite: **${sectionKey}**\n\nCurrent content:\n${currentContent}\n\n${instruction}\n\nReturn ONLY the rewritten section text. No JSON wrapper, no preamble.`,
      },
    ],
  });

  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim();
}
