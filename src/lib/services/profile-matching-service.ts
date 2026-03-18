import {
  ExternalProfileProvider,
  Prisma,
  ProfileMatchStatus,
  ProfileSourceType,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  profileMatchCandidateSchema,
} from '@/lib/validation/linkedin-identity';

import {
  LinkedInIdentityService,
  getOrCreateExternalProfileSource,
  normalizeLinkedInProfileUrl,
} from './linkedin-identity-service';
import type { DatabaseClient } from './types';

export interface LeadProfileMatchContext {
  leadId: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  jobTitle?: string | null;
  email?: string | null;
}

export interface ProfileCandidateInput {
  profileUrl: string;
  fullName: string;
  title?: string;
  companyName?: string;
  location?: string;
  sourceType?: ProfileSourceType;
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

export class ProfileMatchingService {
  static scoreProfileMatch(lead: LeadProfileMatchContext, candidate: ProfileCandidateInput) {
    const leadName = `${normalizeValue(lead.firstName)} ${normalizeValue(lead.lastName)}`.trim();
    const candidateName = normalizeValue(candidate.fullName);
    const companyMatch =
      lead.company && candidate.companyName
        ? normalizeValue(lead.company) === normalizeValue(candidate.companyName)
        : false;
    const titleMatch =
      lead.jobTitle && candidate.title
        ? normalizeValue(candidate.title).includes(normalizeValue(lead.jobTitle)) ||
          normalizeValue(lead.jobTitle).includes(normalizeValue(candidate.title))
        : false;
    const emailSlugMatch =
      lead.email &&
      normalizeValue(candidate.profileUrl).includes(
        normalizeValue(lead.email.split('@')[0] ?? ''),
      );

    let score = 0.2;
    const signals: string[] = [];

    if (leadName === candidateName) {
      score += 0.45;
      signals.push('exact_name');
    } else if (
      candidateName.includes(normalizeValue(lead.firstName)) &&
      candidateName.includes(normalizeValue(lead.lastName))
    ) {
      score += 0.3;
      signals.push('partial_name');
    }

    if (companyMatch) {
      score += 0.2;
      signals.push('company_match');
    }

    if (titleMatch) {
      score += 0.1;
      signals.push('title_match');
    }

    if (emailSlugMatch) {
      score += 0.05;
      signals.push('email_slug_match');
    }

    return {
      confidenceScore: Math.min(1, Number(score.toFixed(2))),
      signals,
    };
  }

  static async suggestProfileMatches(
    lead: LeadProfileMatchContext,
    candidates: ProfileCandidateInput[],
    db: DatabaseClient = getPrismaClient(),
  ) {
    const source = await getOrCreateExternalProfileSource(
      {
        provider: candidates.some(
          (candidate) => candidate.sourceType === ProfileSourceType.ai_inference,
        )
          ? ExternalProfileProvider.internal_ai
          : ExternalProfileProvider.manual,
        sourceType: ProfileSourceType.ai_inference,
        label: 'Profile match scoring',
        description: 'Confidence-based LinkedIn profile match suggestions.',
      },
      db,
    );

    const persisted = [];

    for (const candidate of candidates) {
      const { confidenceScore, signals } = this.scoreProfileMatch(lead, candidate);
      const payload = profileMatchCandidateSchema.parse({
        leadId: lead.leadId,
        profileUrl: candidate.profileUrl,
        fullName: candidate.fullName,
        title: candidate.title,
        companyName: candidate.companyName,
        location: candidate.location,
        sourceType: candidate.sourceType ?? ProfileSourceType.ai_inference,
        confidenceScore,
        matchingSignals: {
          signals,
        },
      });

      persisted.push(
        await db.profileMatchCandidate.create({
          data: {
            ...payload,
            normalizedProfileUrl: normalizeLinkedInProfileUrl(payload.profileUrl),
            matchStatus: ProfileMatchStatus.suggested,
            externalProfileSourceId: source.id,
            matchingSignals:
              payload.matchingSignals as Prisma.InputJsonValue | undefined,
          },
        }),
      );
    }

    return persisted.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  static async confirmSuggestedMatch(
    input: { leadId: string; candidateId: string },
    db: DatabaseClient = getPrismaClient(),
  ) {
    return LinkedInIdentityService.confirmProfileMatch(
      {
        leadId: input.leadId,
        candidateId: input.candidateId,
      },
      db,
    );
  }
}
