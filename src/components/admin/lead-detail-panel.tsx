import type { LeadStatus } from '@prisma/client';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVTextarea,
} from '@/components/trainovations';
import { LeadStageProgress } from '@/components/crm/lead-stage-progress';
import { LeadTimeContext } from '@/components/crm/lead-time-context';
import { formatDate, formatDateTime, formatPercent, formatEnumLabel, getPriorityVariant } from '@/lib/format';

export function LeadDetailPanel({
  lead,
  activity,
  actions,
}: {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    jobTitle: string | null;
    email: string;
    phone: string | null;
    location: string | null;
    industry: string | null;
    interest: string | null;
    notes: string | null;
    consent: boolean;
    status: string;
    sourceType: string;
    submittedAt: Date;
    repProfile: { displayName: string; slug: string; location?: string | null } | null;
    landingPage: { title: string; slug: string } | null;
    duplicateOfLead: { id: string; firstName: string; lastName: string; email: string } | null;
    notesList: Array<{
      id: string;
      content: string;
      sourceType?: string;
      createdAt: Date;
      author: { name: string | null; email: string | null } | null;
    }>;
    linkedInProfileLinks: Array<{
      id: string;
      profileUrl: string;
      headline: string | null;
      location: string | null;
      sourceType: string;
      status: string;
      confidenceScore: number;
      humanConfirmed: boolean;
      officialData: boolean;
      lastCheckedAt: Date | null;
      externalProfileSource: {
        label: string;
        provider: string;
        isOfficial: boolean;
      } | null;
    }>;
    employmentSnapshots: Array<{
      id: string;
      title: string;
      companyName: string;
      startDate: Date | null;
      endDate: Date | null;
      isCurrent: boolean;
      companyPageUrl: string | null;
      sourceType: string;
      confidenceScore: number;
      retrievedAt: Date;
      externalProfileSource: { label: string } | null;
    }>;
    employmentChangeEvents: Array<{
      id: string;
      changeType: string;
      titleFrom: string | null;
      titleTo: string | null;
      companyFrom: string | null;
      companyTo: string | null;
      confidenceScore: number;
      detectedAt: Date;
    }>;
    profileMatchCandidates: Array<{
      id: string;
      profileUrl: string;
      fullName: string;
      title: string | null;
      companyName: string | null;
      sourceType: string;
      matchStatus: string;
      confidenceScore: number;
      humanReviewed: boolean;
      externalProfileSource: { label: string } | null;
    }>;
    relationshipHistory: Array<{
      id: string;
      companyName: string;
      title: string | null;
      stage: string;
      startDate: Date | null;
      endDate: Date | null;
      confidenceScore: number;
      sourceType: string;
      originType?: string;
      repProfile?: { displayName: string } | null;
      externalProfileSource: { label: string } | null;
    }>;
    relationshipMilestones: Array<{
      id: string;
      milestoneType: string;
      title: string;
      description: string | null;
      occurredAt: Date;
      confidenceScore: number;
      originType: string;
    }>;
    contactCompanyAssociations: Array<{
      id: string;
      companyName: string;
      associationType: string;
      status: string;
      isCurrent: boolean;
      isStrategic: boolean;
      confidenceScore: number;
      startDate: Date | null;
      endDate: Date | null;
    }>;
    championFlag: {
      isActive: boolean;
      status?: string;
      priority?: string;
      rationale: string | null;
      notes?: string | null;
      ownerRepProfile?: { displayName: string } | null;
      confidenceScore: number;
      originType?: string;
    } | null;
    contactWatchlist: {
      isActive: boolean;
      category?: string;
      priority: string;
      reason: string | null;
      notifyOnEmploymentChange: boolean;
      notifyOnTitleChange?: boolean;
      notifyOnBrokenLink: boolean;
      notifyOnStaleData?: boolean;
      notifyOnTargetCompanyMatch?: boolean;
      originType?: string;
    } | null;
    careerMovementAlerts: Array<{
      id: string;
      title: string;
      message: string;
      priority: string;
      status: string;
      suggestedNextStep?: string | null;
      confidenceScore?: number;
      triggeredAt: Date;
      employmentChangeEvent: {
        changeType: string;
      } | null;
      externalProfileSource: { label: string } | null;
    }>;
    expansionOpportunitySignals: Array<{
      id: string;
      opportunityType: string;
      status: string;
      priority: string;
      companyName: string;
      title: string;
      summary: string;
      suggestedNextStep: string | null;
      rationale: string | null;
      confidenceScore: number;
      createdAt: Date;
    }>;
    repActionPrompts: Array<{
      id: string;
      promptType: string;
      status: string;
      priority: string;
      title: string;
      message: string;
      suggestedAction: string | null;
      createdAt: Date;
    }>;
    outreachDrafts: Array<{
      id: string;
      type: string;
      status: string;
      subject: string;
      bodyText: string;
      recipientEmail: string | null;
      explanation: string | null;
      suggestedCta: string | null;
      confidenceScore: number | null;
      generatedAt: Date | null;
    }>;
    repTaskSuggestions: Array<{
      id: string;
      type: string;
      status: string;
      priority: string;
      title: string;
      reason: string;
      explanation: string | null;
      recommendedDueAt: Date | null;
      confidenceScore: number | null;
    }>;
  };
  activity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    actorUser: { name: string | null; email: string | null } | null;
  }>;
  actions?: {
    linkManualLinkedInProfileAction?: (formData: FormData) => Promise<void>;
    confirmProfileMatchCandidateAction?: (formData: FormData) => Promise<void>;
    updateChampionFlagAction?: (formData: FormData) => Promise<void>;
    updateContactWatchlistAction?: (formData: FormData) => Promise<void>;
    generateLeadOutreachDraftAction?: (formData: FormData) => Promise<void>;
    updateOutreachDraftStatusAction?: (formData: FormData) => Promise<void>;
    generateLeadTaskSuggestionsAction?: (formData: FormData) => Promise<void>;
    updateRepTaskSuggestionStatusAction?: (formData: FormData) => Promise<void>;
  };
}) {
  const primaryProfile = lead.linkedInProfileLinks[0] ?? null;

  return (
    <div className="tv-stagger grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="tv-stagger space-y-6">
        <TVCard className="space-y-4">
          <div className="flex items-center justify-between">
            <TVCardTitle>
              {lead.firstName} {lead.lastName}
            </TVCardTitle>
            <TVBadge variant="primary">{lead.status.replace('_', ' ')}</TVBadge>
          </div>
          <TVCardDescription>
            Submitted {formatDateTime(lead.submittedAt)}
          </TVCardDescription>
          <div className="rounded-2xl border bg-surface-muted/60 p-4">
            <LeadStageProgress status={lead.status as LeadStatus} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-label text-foreground">Company</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.company ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Job Title</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.jobTitle ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Email</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.email}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Phone</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Location</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.location ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Industry</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.industry ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Interest</p>
              <p className="mt-1 text-sm text-muted-foreground">{lead.interest ?? '—'}</p>
            </div>
            <div>
              <p className="text-label text-foreground">Assigned Rep</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.repProfile?.displayName ?? 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-label text-foreground">Consent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.consent ? 'Granted' : 'Not granted'}
              </p>
            </div>
          </div>
          <LeadTimeContext
            leadLocation={lead.location}
            repLocation={lead.repProfile?.location ?? null}
          />
          <div>
            <p className="text-label text-foreground">Notes</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {lead.notes ?? 'No lead notes were submitted.'}
            </p>
          </div>
        </TVCard>

        <TVCard className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <TVCardTitle>LinkedIn Profile</TVCardTitle>
              <TVCardDescription>
                Track profile provenance, confidence, and human confirmation without treating unverified data as fact.
              </TVCardDescription>
            </div>
            {primaryProfile ? (
              <div className="flex flex-wrap gap-2">
                <TVBadge variant={primaryProfile.humanConfirmed ? 'success' : 'default'}>
                  {primaryProfile.humanConfirmed ? 'Human confirmed' : 'Needs review'}
                </TVBadge>
                <TVBadge variant={primaryProfile.officialData ? 'primary' : 'default'}>
                  {primaryProfile.officialData ? 'Official' : 'Non-official'}
                </TVBadge>
              </div>
            ) : null}
          </div>

          {primaryProfile ? (
            <div className="space-y-4 rounded-lg border bg-surface-muted p-4">
              <a
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={primaryProfile.profileUrl}
                rel="noreferrer"
                target="_blank"
              >
                {primaryProfile.profileUrl}
              </a>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-label text-foreground">Headline</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {primaryProfile.headline ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-label text-foreground">Location</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {primaryProfile.location ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-label text-foreground">Source</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {primaryProfile.externalProfileSource?.label ??
                      formatEnumLabel(primaryProfile.sourceType)}
                  </p>
                </div>
                <div>
                  <p className="text-label text-foreground">Confidence</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPercent(primaryProfile.confidenceScore)}
                  </p>
                </div>
                <div>
                  <p className="text-label text-foreground">Status</p>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {formatEnumLabel(primaryProfile.status)}
                  </p>
                </div>
                <div>
                  <p className="text-label text-foreground">Last Checked</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {primaryProfile.lastCheckedAt
                      ? formatDateTime(primaryProfile.lastCheckedAt)
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No LinkedIn profile is linked yet.
            </p>
          )}

          {actions?.linkManualLinkedInProfileAction ? (
            <form action={actions.linkManualLinkedInProfileAction} className="space-y-3">
              <input name="leadId" type="hidden" value={lead.id} />
              <label className="block text-label text-foreground">
                Manually attach LinkedIn URL
              </label>
              <TVInput
                name="profileUrl"
                placeholder="https://www.linkedin.com/in/example-profile"
                required
              />
              <TVButton type="submit">Attach Profile</TVButton>
            </form>
          ) : null}

          {lead.profileMatchCandidates.length ? (
            <div className="space-y-3">
              <p className="text-label text-foreground">Match Suggestions</p>
              {lead.profileMatchCandidates.slice(0, 3).map((candidate) => (
                <div key={candidate.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {candidate.fullName}
                    </p>
                    <TVBadge variant="default">
                      {formatPercent(candidate.confidenceScore)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(candidate.matchStatus)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {candidate.title ?? '—'} {candidate.companyName ? `· ${candidate.companyName}` : ''}
                  </p>
                  <a
                    className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
                    href={candidate.profileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Review profile
                  </a>
                  {actions?.confirmProfileMatchCandidateAction &&
                  candidate.matchStatus === 'suggested' ? (
                    <form
                      action={actions.confirmProfileMatchCandidateAction}
                      className="mt-3"
                    >
                      <input name="leadId" type="hidden" value={lead.id} />
                      <input name="candidateId" type="hidden" value={candidate.id} />
                      <TVButton type="submit" variant="secondary">
                        Confirm Match
                      </TVButton>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Employment History</TVCardTitle>
          <div className="space-y-3">
            {lead.employmentSnapshots.length ? (
              lead.employmentSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {snapshot.title} · {snapshot.companyName}
                    </p>
                    {snapshot.isCurrent ? (
                      <TVBadge variant="success">Current</TVBadge>
                    ) : null}
                    <TVBadge variant="default">
                      {formatPercent(snapshot.confidenceScore)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {snapshot.externalProfileSource?.label ??
                        formatEnumLabel(snapshot.sourceType)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(snapshot.startDate)} - {formatDate(snapshot.endDate)} ·
                    retrieved {formatDateTime(snapshot.retrievedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No employment history has been recorded yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Relationship History</TVCardTitle>
          <div className="space-y-3">
            {lead.relationshipHistory.length ? (
              lead.relationshipHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {entry.companyName}
                    </p>
                    <TVBadge variant="default">{formatEnumLabel(entry.stage)}</TVBadge>
                    <TVBadge variant="default">
                      {formatPercent(entry.confidenceScore)}
                    </TVBadge>
                    {entry.originType ? (
                      <TVBadge variant="default">
                        {formatEnumLabel(entry.originType)}
                      </TVBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.title ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.repProfile?.displayName
                      ? `Known by ${entry.repProfile.displayName}`
                      : entry.externalProfileSource?.label ?? formatEnumLabel(entry.sourceType)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No relationship history has been recorded yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Relationship Timeline</TVCardTitle>
          <div className="space-y-3">
            {lead.relationshipMilestones.length ? (
              lead.relationshipMilestones.map((milestone) => (
                <div key={milestone.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{milestone.title}</p>
                    <TVBadge variant="default">
                      {formatEnumLabel(milestone.milestoneType)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatPercent(milestone.confidenceScore)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(milestone.originType)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {milestone.description ?? 'No additional milestone details recorded.'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(milestone.occurredAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No relationship milestones have been recorded yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Company Associations</TVCardTitle>
          <div className="space-y-3">
            {lead.contactCompanyAssociations.length ? (
              lead.contactCompanyAssociations.map((association) => (
                <div key={association.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {association.companyName}
                    </p>
                    <TVBadge variant={association.isCurrent ? 'success' : 'default'}>
                      {association.isCurrent ? 'Current' : 'Historical'}
                    </TVBadge>
                    <TVBadge variant={association.isStrategic ? 'primary' : 'default'}>
                      {association.isStrategic ? 'Strategic' : formatEnumLabel(association.status)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(association.associationType)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(association.startDate)} - {formatDate(association.endDate)} ·{' '}
                    {formatPercent(association.confidenceScore)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No company associations have been recorded yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Lead Notes</TVCardTitle>
          <div className="space-y-3">
            {lead.notesList.length ? (
              lead.notesList.map((note) => (
                <div key={note.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {note.sourceType ? (
                      <TVBadge
                        variant={note.sourceType === 'ai_generated' ? 'accent' : 'default'}
                      >
                        {formatEnumLabel(note.sourceType)}
                      </TVBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-foreground">{note.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)} ·{' '}
                    {note.author?.name ?? note.author?.email ?? 'System'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
            )}
          </div>
        </TVCard>
      </div>

      <div className="tv-stagger space-y-6">
        <TVCard className="space-y-4">
          <TVCardTitle>Watchlist and Champion Status</TVCardTitle>
          <div className="space-y-4 rounded-lg border bg-surface-muted p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge variant={lead.championFlag?.isActive ? 'success' : 'default'}>
                {lead.championFlag?.isActive ? 'Champion' : 'Not champion'}
              </TVBadge>
              <TVBadge variant={lead.contactWatchlist?.isActive ? 'primary' : 'default'}>
                {lead.contactWatchlist?.isActive
                  ? `Watchlist: ${formatEnumLabel(lead.contactWatchlist.priority)}`
                  : 'Not watched'}
              </TVBadge>
              {lead.championFlag?.status ? (
                <TVBadge variant="default">
                  {formatEnumLabel(lead.championFlag.status)}
                </TVBadge>
              ) : null}
              {lead.championFlag?.priority ? (
                <TVBadge variant="default">
                  {formatEnumLabel(lead.championFlag.priority)}
                </TVBadge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {lead.championFlag?.rationale ??
                lead.contactWatchlist?.reason ??
                'No relationship monitoring notes yet.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-xs text-muted-foreground">
                Champion owner:{' '}
                {lead.championFlag?.ownerRepProfile?.displayName ?? 'Unassigned'}
              </p>
              <p className="text-xs text-muted-foreground">
                Watchlist category:{' '}
                {lead.contactWatchlist?.category
                  ? formatEnumLabel(lead.contactWatchlist.category)
                  : 'None'}
              </p>
              <p className="text-xs text-muted-foreground">
                Champion confidence:{' '}
                {lead.championFlag ? formatPercent(lead.championFlag.confidenceScore) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                Watch source:{' '}
                {lead.contactWatchlist?.originType
                  ? formatEnumLabel(lead.contactWatchlist.originType)
                  : '—'}
              </p>
            </div>
          </div>

          {actions?.updateChampionFlagAction ? (
            <form action={actions.updateChampionFlagAction} className="space-y-3">
              <input name="leadId" type="hidden" value={lead.id} />
              <input
                name="isActive"
                type="hidden"
                value={lead.championFlag?.isActive ? 'false' : 'true'}
              />
              <input name="confidenceScore" type="hidden" value="0.8" />
              <TVTextarea
                name="rationale"
                placeholder="Why is this contact strategically important?"
                defaultValue={lead.championFlag?.rationale ?? ''}
              />
              <TVButton type="submit" variant="secondary">
                {lead.championFlag?.isActive ? 'Remove Champion Flag' : 'Mark as Champion'}
              </TVButton>
            </form>
          ) : null}

          {actions?.updateContactWatchlistAction ? (
            <form action={actions.updateContactWatchlistAction} className="space-y-3">
              <input name="leadId" type="hidden" value={lead.id} />
              <input
                name="isActive"
                type="hidden"
                value={lead.contactWatchlist?.isActive ? 'false' : 'true'}
              />
              <input name="notifyOnEmploymentChange" type="hidden" value="true" />
              <input name="notifyOnBrokenLink" type="hidden" value="true" />
              <label className="block text-label text-foreground">Watchlist priority</label>
              <select
                className="tv-form-select"
                defaultValue={lead.contactWatchlist?.priority ?? 'normal'}
                name="priority"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <TVTextarea
                name="reason"
                placeholder="Why should this lead stay on a watchlist?"
                defaultValue={lead.contactWatchlist?.reason ?? ''}
              />
              <TVButton type="submit">
                {lead.contactWatchlist?.isActive
                  ? 'Disable Watchlist'
                  : 'Enable Watchlist'}
              </TVButton>
            </form>
          ) : null}
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Career Movement Alerts</TVCardTitle>
          <div className="space-y-3">
            {lead.careerMovementAlerts.length ? (
              lead.careerMovementAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <TVBadge
                      variant={getPriorityVariant(alert.priority)}
                    >
                      {formatEnumLabel(alert.priority)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(alert.status)}
                    </TVBadge>
                    {typeof alert.confidenceScore === 'number' ? (
                      <TVBadge variant="default">
                        {formatPercent(alert.confidenceScore)}
                      </TVBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                  {alert.suggestedNextStep ? (
                    <p className="mt-2 text-sm text-foreground">
                      Suggested next step: {alert.suggestedNextStep}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(alert.triggeredAt)} ·{' '}
                    {alert.externalProfileSource?.label ??
                      alert.employmentChangeEvent?.changeType.replace(/_/g, ' ') ??
                      'CRM'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No career movement alerts have been triggered yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <TVCardTitle>Outreach Drafts</TVCardTitle>
              <TVCardDescription>
                Reviewable rep-ready drafts generated from lead, meeting, and relationship context.
              </TVCardDescription>
            </div>
            {actions?.generateLeadOutreachDraftAction ? (
              <form action={actions.generateLeadOutreachDraftAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <TVButton type="submit" variant="secondary">
                  Generate Draft
                </TVButton>
              </form>
            ) : null}
          </div>
          <div className="space-y-3">
            {lead.outreachDrafts.length ? (
              lead.outreachDrafts.map((draft) => (
                <div key={draft.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{draft.subject}</p>
                    <TVBadge variant="primary">{formatEnumLabel(draft.type)}</TVBadge>
                    <TVBadge variant="default">{formatEnumLabel(draft.status)}</TVBadge>
                    {typeof draft.confidenceScore === 'number' ? (
                      <TVBadge variant="default">
                        {formatPercent(draft.confidenceScore)}
                      </TVBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                    {draft.bodyText}
                  </p>
                  {draft.explanation ? (
                    <p className="mt-2 text-sm text-foreground">{draft.explanation}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {draft.recipientEmail ?? 'No recipient email'} ·{' '}
                    {draft.generatedAt ? formatDateTime(draft.generatedAt) : 'Draft time pending'}
                  </p>
                  {actions?.updateOutreachDraftStatusAction &&
                  (draft.status === 'generated' || draft.status === 'reviewed') ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {draft.status === 'generated' ? (
                        <form action={actions.updateOutreachDraftStatusAction}>
                          <input name="leadId" type="hidden" value={lead.id} />
                          <input name="draftId" type="hidden" value={draft.id} />
                          <input name="status" type="hidden" value="reviewed" />
                          <TVButton size="sm" type="submit" variant="secondary">
                            Mark Reviewed
                          </TVButton>
                        </form>
                      ) : null}
                      <form action={actions.updateOutreachDraftStatusAction}>
                        <input name="leadId" type="hidden" value={lead.id} />
                        <input name="draftId" type="hidden" value={draft.id} />
                        <input name="status" type="hidden" value="approved" />
                        <TVButton size="sm" type="submit">
                          Approve Draft
                        </TVButton>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No outreach drafts have been generated yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Expansion Opportunity Signals</TVCardTitle>
          <div className="space-y-3">
            {lead.expansionOpportunitySignals.length ? (
              lead.expansionOpportunitySignals.map((signal) => (
                <div key={signal.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{signal.title}</p>
                    <TVBadge variant={getPriorityVariant(signal.priority)}>
                      {formatEnumLabel(signal.priority)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(signal.opportunityType)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(signal.status)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{signal.summary}</p>
                  {signal.suggestedNextStep ? (
                    <p className="mt-2 text-sm text-foreground">
                      Suggested next step: {signal.suggestedNextStep}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {signal.companyName} · {formatPercent(signal.confidenceScore)} · created{' '}
                    {formatDateTime(signal.createdAt)}
                  </p>
                  {signal.rationale ? (
                    <p className="mt-1 text-xs text-muted-foreground">{signal.rationale}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No account expansion opportunities have been detected yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Rep Action Prompts</TVCardTitle>
          <div className="space-y-3">
            {lead.repActionPrompts.length ? (
              lead.repActionPrompts.map((prompt) => (
                <div key={prompt.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{prompt.title}</p>
                    <TVBadge variant={getPriorityVariant(prompt.priority)}>
                      {formatEnumLabel(prompt.priority)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(prompt.promptType)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatEnumLabel(prompt.status)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{prompt.message}</p>
                  {prompt.suggestedAction ? (
                    <p className="mt-2 text-sm text-foreground">
                      Suggested action: {prompt.suggestedAction}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDateTime(prompt.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No rep action prompts have been generated yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Employment Change Events</TVCardTitle>
          <div className="space-y-3">
            {lead.employmentChangeEvents.length ? (
              lead.employmentChangeEvents.map((event) => (
                <div key={event.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <TVBadge variant="default">
                      {formatEnumLabel(event.changeType)}
                    </TVBadge>
                    <TVBadge variant="default">
                      {formatPercent(event.confidenceScore)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.companyFrom || event.companyTo
                      ? `${event.companyFrom ?? '—'} -> ${event.companyTo ?? '—'}`
                      : `${event.titleFrom ?? '—'} -> ${event.titleTo ?? '—'}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Detected {formatDateTime(event.detectedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No employment changes have been detected yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Source Context</TVCardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-label text-foreground">Source Type</p>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {lead.sourceType.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-label text-foreground">Landing Page</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.landingPage
                  ? `${lead.landingPage.title} (${lead.landingPage.slug})`
                  : '—'}
              </p>
            </div>
          </div>
          {lead.duplicateOfLead ? (
            <div className="rounded-lg border bg-surface-muted p-4">
              <p className="text-label text-foreground">Potential Duplicate</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Linked to {lead.duplicateOfLead.firstName} {lead.duplicateOfLead.lastName} (
                {lead.duplicateOfLead.email})
              </p>
            </div>
          ) : null}
        </TVCard>

        <TVCard className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <TVCardTitle>Task Suggestions</TVCardTitle>
              <TVCardDescription>
                Suggested next actions derived from lead state, movement alerts, and open rep prompts.
              </TVCardDescription>
            </div>
            {actions?.generateLeadTaskSuggestionsAction ? (
              <form action={actions.generateLeadTaskSuggestionsAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <TVButton type="submit" variant="secondary">
                  Generate Tasks
                </TVButton>
              </form>
            ) : null}
          </div>
          <div className="space-y-3">
            {lead.repTaskSuggestions.length ? (
              lead.repTaskSuggestions.map((task) => (
                <div key={task.id} className="rounded-lg border bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <TVBadge variant={getPriorityVariant(task.priority)}>
                      {formatEnumLabel(task.priority)}
                    </TVBadge>
                    <TVBadge variant="default">{formatEnumLabel(task.status)}</TVBadge>
                    <TVBadge variant="default">{formatEnumLabel(task.type)}</TVBadge>
                    {typeof task.confidenceScore === 'number' ? (
                      <TVBadge variant="default">
                        {formatPercent(task.confidenceScore)}
                      </TVBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.reason}</p>
                  {task.explanation ? (
                    <p className="mt-2 text-sm text-foreground">{task.explanation}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Due {formatDate(task.recommendedDueAt)}
                  </p>
                  {actions?.updateRepTaskSuggestionStatusAction &&
                  task.status === 'generated' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={actions.updateRepTaskSuggestionStatusAction}>
                        <input name="leadId" type="hidden" value={lead.id} />
                        <input name="suggestionId" type="hidden" value={task.id} />
                        <input name="status" type="hidden" value="acknowledged" />
                        <TVButton size="sm" type="submit" variant="secondary">
                          Acknowledge
                        </TVButton>
                      </form>
                      <form action={actions.updateRepTaskSuggestionStatusAction}>
                        <input name="leadId" type="hidden" value={lead.id} />
                        <input name="suggestionId" type="hidden" value={task.id} />
                        <input name="status" type="hidden" value="converted" />
                        <TVButton size="sm" type="submit">
                          Mark Converted
                        </TVButton>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No task suggestions have been generated yet.
              </p>
            )}
          </div>
        </TVCard>

        <TVCard className="space-y-4">
          <TVCardTitle>Activity Timeline</TVCardTitle>
          <div className="space-y-4">
            {activity.length ? (
              activity.map((entry) => (
                <div key={entry.id} className="rounded-lg border bg-surface-muted p-4">
                  <p className="text-sm font-medium capitalize text-foreground">
                    {entry.type.replace('_', ' ')}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)} ·{' '}
                    {entry.actorUser?.name ?? entry.actorUser?.email ?? 'System'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity has been logged yet.</p>
            )}
          </div>
        </TVCard>
      </div>
    </div>
  );
}
