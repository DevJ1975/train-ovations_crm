import {
  ActivityLogType,
  ExternalProfileProvider,
  LinkedInProfileLinkStatus,
  ProfileMatchStatus,
  ProfileSourceType,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  confirmProfileMatchSchema,
  manualLinkedInProfileLinkSchema,
  type ConfirmProfileMatchInput,
  type ManualLinkedInProfileLinkInput,
} from '@/lib/validation/linkedin-identity';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

export function normalizeLinkedInProfileUrl(profileUrl: string) {
  const url = new URL(profileUrl);
  const normalizedPath = url.pathname.replace(/\/+$/, '').toLowerCase();

  return `https://www.linkedin.com${normalizedPath}`;
}

async function getOrCreateExternalProfileSource(
  input: {
    provider: ExternalProfileProvider;
    sourceType: ProfileSourceType;
    label: string;
    description?: string;
    isOfficial?: boolean;
  },
  db: DatabaseClient,
) {
  const existing = await db.externalProfileSource.findFirst({
    where: {
      provider: input.provider,
      sourceType: input.sourceType,
      label: input.label,
    },
  });

  if (existing) {
    return existing;
  }

  return db.externalProfileSource.create({
    data: {
      provider: input.provider,
      sourceType: input.sourceType,
      label: input.label,
      description: input.description,
      isOfficial: input.isOfficial ?? false,
    },
  });
}

export class LinkedInIdentityService {
  static async attachManualProfileUrl(
    input: ManualLinkedInProfileLinkInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = manualLinkedInProfileLinkSchema.parse(input);
    const normalizedProfileUrl = normalizeLinkedInProfileUrl(validated.profileUrl);
    const source = await getOrCreateExternalProfileSource(
      {
        provider: ExternalProfileProvider.manual,
        sourceType: ProfileSourceType.user_provided,
        label: 'Manual LinkedIn URL',
        description: 'Manually attached LinkedIn profile URL confirmed by a CRM user.',
      },
      db,
    );

    const profileLink = await db.linkedInProfileLink.upsert({
      where: {
        leadId_normalizedProfileUrl: {
          leadId: validated.leadId,
          normalizedProfileUrl,
        },
      },
      update: {
        profileUrl: validated.profileUrl,
        normalizedProfileUrl,
        sourceType: ProfileSourceType.user_provided,
        status: LinkedInProfileLinkStatus.active,
        confidenceScore: validated.confidenceScore,
        humanConfirmed: validated.humanConfirmed,
        officialData: false,
        lastCheckedAt: new Date(),
        lastConfirmedAt: validated.humanConfirmed ? new Date() : undefined,
        externalProfileSourceId: source.id,
      },
      create: {
        leadId: validated.leadId,
        profileUrl: validated.profileUrl,
        normalizedProfileUrl,
        sourceType: ProfileSourceType.user_provided,
        status: LinkedInProfileLinkStatus.active,
        confidenceScore: validated.confidenceScore,
        humanConfirmed: validated.humanConfirmed,
        officialData: false,
        lastCheckedAt: new Date(),
        lastConfirmedAt: validated.humanConfirmed ? new Date() : undefined,
        externalProfileSourceId: source.id,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.linkedin_profile_linked,
        description: 'LinkedIn profile linked to lead.',
        leadId: validated.leadId,
        metadata: {
          linkedInProfileLinkId: profileLink.id,
          profileUrl: profileLink.profileUrl,
          sourceType: profileLink.sourceType,
          confidenceScore: profileLink.confidenceScore,
          humanConfirmed: profileLink.humanConfirmed,
        },
      },
      db,
    );

    return profileLink;
  }

  static async confirmProfileMatch(
    input: Omit<ConfirmProfileMatchInput, 'matchStatus'> & {
      matchStatus?: ConfirmProfileMatchInput['matchStatus'];
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = confirmProfileMatchSchema.parse(input);
    const candidate = await db.profileMatchCandidate.findUnique({
      where: { id: validated.candidateId },
    });

    if (!candidate || candidate.leadId !== validated.leadId) {
      throw new Error('Profile match candidate was not found for this lead.');
    }

    const source = await getOrCreateExternalProfileSource(
      {
        provider:
          candidate.sourceType === ProfileSourceType.third_party_enrichment
            ? ExternalProfileProvider.third_party
            : candidate.sourceType === ProfileSourceType.ai_inference
              ? ExternalProfileProvider.internal_ai
              : ExternalProfileProvider.linkedin,
        sourceType: candidate.sourceType,
        label: 'Profile match suggestion',
        description: 'Confidence-scored LinkedIn profile match suggestion.',
        isOfficial: candidate.sourceType === ProfileSourceType.official_linkedin,
      },
      db,
    );

    await db.profileMatchCandidate.updateMany({
      where: {
        leadId: validated.leadId,
        matchStatus: ProfileMatchStatus.suggested,
      },
      data: {
        humanReviewed: true,
        matchStatus:
          validated.matchStatus === ProfileMatchStatus.confirmed
            ? ProfileMatchStatus.rejected
            : validated.matchStatus,
        rejectedAt:
          validated.matchStatus === ProfileMatchStatus.confirmed ? new Date() : undefined,
      },
    });

    const updatedCandidate = await db.profileMatchCandidate.update({
      where: { id: validated.candidateId },
      data: {
        matchStatus: validated.matchStatus,
        humanReviewed: true,
        confirmedAt:
          validated.matchStatus === ProfileMatchStatus.confirmed ? new Date() : undefined,
        rejectedAt:
          validated.matchStatus === ProfileMatchStatus.rejected ? new Date() : undefined,
      },
    });

    if (validated.matchStatus !== ProfileMatchStatus.confirmed) {
      return updatedCandidate;
    }

    const link = await db.linkedInProfileLink.upsert({
      where: {
        leadId_normalizedProfileUrl: {
          leadId: validated.leadId,
          normalizedProfileUrl: updatedCandidate.normalizedProfileUrl,
        },
      },
      update: {
        profileUrl: updatedCandidate.profileUrl,
        normalizedProfileUrl: updatedCandidate.normalizedProfileUrl,
        memberId: updatedCandidate.memberId,
        headline: updatedCandidate.title,
        location: updatedCandidate.location,
        sourceType: updatedCandidate.sourceType,
        confidenceScore: updatedCandidate.confidenceScore,
        humanConfirmed: true,
        status: LinkedInProfileLinkStatus.active,
        lastCheckedAt: new Date(),
        lastConfirmedAt: new Date(),
        externalProfileSourceId: source.id,
      },
      create: {
        leadId: validated.leadId,
        profileUrl: updatedCandidate.profileUrl,
        normalizedProfileUrl: updatedCandidate.normalizedProfileUrl,
        memberId: updatedCandidate.memberId,
        headline: updatedCandidate.title,
        location: updatedCandidate.location,
        sourceType: updatedCandidate.sourceType,
        confidenceScore: updatedCandidate.confidenceScore,
        humanConfirmed: true,
        status: LinkedInProfileLinkStatus.active,
        lastCheckedAt: new Date(),
        lastConfirmedAt: new Date(),
        externalProfileSourceId: source.id,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.profile_match_confirmed,
        description: 'LinkedIn profile match confirmed by a CRM user.',
        leadId: validated.leadId,
        metadata: {
          candidateId: updatedCandidate.id,
          linkedInProfileLinkId: link.id,
          confidenceScore: updatedCandidate.confidenceScore,
          sourceType: updatedCandidate.sourceType,
        },
      },
      db,
    );

    return link;
  }

  static async linkOfficialProfileIdentity(
    input: {
      leadId: string;
      profileUrl: string;
      memberId: string;
      headline?: string;
      location?: string;
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    const source = await getOrCreateExternalProfileSource(
      {
        provider: ExternalProfileProvider.linkedin,
        sourceType: ProfileSourceType.official_linkedin,
        label: 'Official LinkedIn account link',
        description: 'Official LinkedIn identity linked with explicit consent.',
        isOfficial: true,
      },
      db,
    );

    const normalizedProfileUrl = normalizeLinkedInProfileUrl(input.profileUrl);

    return db.linkedInProfileLink.upsert({
      where: {
        leadId_normalizedProfileUrl: {
          leadId: input.leadId,
          normalizedProfileUrl,
        },
      },
      update: {
        profileUrl: input.profileUrl,
        normalizedProfileUrl,
        memberId: input.memberId,
        headline: input.headline,
        location: input.location,
        sourceType: ProfileSourceType.official_linkedin,
        confidenceScore: 1,
        humanConfirmed: true,
        officialData: true,
        status: LinkedInProfileLinkStatus.active,
        lastCheckedAt: new Date(),
        lastConfirmedAt: new Date(),
        externalProfileSourceId: source.id,
      },
      create: {
        leadId: input.leadId,
        profileUrl: input.profileUrl,
        normalizedProfileUrl,
        memberId: input.memberId,
        headline: input.headline,
        location: input.location,
        sourceType: ProfileSourceType.official_linkedin,
        confidenceScore: 1,
        humanConfirmed: true,
        officialData: true,
        status: LinkedInProfileLinkStatus.active,
        lastCheckedAt: new Date(),
        lastConfirmedAt: new Date(),
        externalProfileSourceId: source.id,
      },
    });
  }
}

export { getOrCreateExternalProfileSource };
