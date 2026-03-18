import Link from 'next/link';

import { TVBadge, TVButton, TVCard, TVInput, TVTextarea } from '@/components/trainovations';

import { RepPerformanceMiniChart } from './rep-performance-mini-chart';

export function RepManagementList({
  reps,
  repPerformance,
  updateAction,
  inviteAction,
  resendInviteAction,
  offboardAction,
}: {
  reps: Array<{
    id: string;
    userId: string;
    slug: string;
    firstName: string;
    lastName: string;
    displayName: string;
    title: string;
    email: string;
    phone: string | null;
    website: string | null;
    location: string | null;
    bio: string;
    isActive: boolean;
    inviteStatus: 'pending' | 'accepted' | 'not_invited';
    invitationSentAt: Date | null;
    invitationAcceptedAt: Date | null;
    lastLoginAt: Date | null;
    ownedLeadCount: number;
    ownedAccountCount: number;
    ownedOpportunityCount: number;
      landingPages: Array<{
        slug: string;
        title: string;
      }>;
    }>;
  repPerformance: Array<{
    repId: string;
    repName: string;
    lastLoginAt: Date | null;
    inviteStatus: 'pending' | 'accepted' | 'not_invited';
    leadsOwned: number;
    newLeadsLast30Days: number;
    qualifiedLeads: number;
    accountsOwned: number;
    openOpportunities: number;
    pipelineValueCents: number;
    weightedForecastValueCents: number;
    closedWonValueCents: number;
    averageDealSizeCents: number;
    winRatePercent: number;
  }>;
  updateAction: (formData: FormData) => Promise<void>;
  inviteAction: (formData: FormData) => Promise<void>;
  resendInviteAction: (formData: FormData) => Promise<void>;
  offboardAction: (formData: FormData) => Promise<void>;
}) {
  const repPerformanceById = new Map(repPerformance.map((entry) => [entry.repId, entry]));

  function formatCurrency(amountCents: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amountCents / 100);
  }

  return (
    <div className="space-y-6">
      <TVCard className="space-y-5">
        <div>
          <h2 className="text-card text-foreground">Invite a rep</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a rep account, email a temporary password, and require a password change on first sign-in.
          </p>
        </div>

        <form action={inviteAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="invite-first-name">
                First name
              </label>
              <TVInput id="invite-first-name" name="firstName" />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="invite-last-name">
                Last name
              </label>
              <TVInput id="invite-last-name" name="lastName" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="invite-email">
                Email
              </label>
              <TVInput id="invite-email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="invite-title">
                Title
              </label>
              <TVInput id="invite-title" name="title" />
            </div>
          </div>

	          <div className="grid gap-4 sm:grid-cols-2">
	            <div className="space-y-2">
	              <label className="text-label text-foreground" htmlFor="invite-phone">
	                Phone
	              </label>
	              <TVInput id="invite-phone" name="phone" />
	            </div>
	            <div className="space-y-2">
	              <label className="text-label text-foreground" htmlFor="invite-website">
	                Website
	              </label>
	              <TVInput id="invite-website" name="website" />
	            </div>
	          </div>

	          <div className="grid gap-4 sm:grid-cols-2">
	            <div className="space-y-2">
	              <label className="text-label text-foreground" htmlFor="invite-location">
	                Location
	              </label>
	              <TVInput id="invite-location" name="location" />
	            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label text-foreground" htmlFor="invite-bio">
              Bio
            </label>
            <TVTextarea id="invite-bio" name="bio" />
          </div>

          <TVButton type="submit">Send Invite</TVButton>
        </form>
      </TVCard>

      {reps.map((rep) => (
        <TVCard key={rep.id} className="space-y-5">
          {repPerformanceById.get(rep.id) ? (
            <div className="space-y-3 rounded-[1.5rem] border bg-surface-muted/45 p-4">
              <RepPerformanceMiniChart
                closedWonValueCents={repPerformanceById.get(rep.id)?.closedWonValueCents ?? 0}
                pipelineValueCents={repPerformanceById.get(rep.id)?.pipelineValueCents ?? 0}
                weightedForecastValueCents={repPerformanceById.get(rep.id)?.weightedForecastValueCents ?? 0}
                winRatePercent={repPerformanceById.get(rep.id)?.winRatePercent ?? 0}
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leads</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {repPerformanceById.get(rep.id)?.leadsOwned}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {repPerformanceById.get(rep.id)?.newLeadsLast30Days} new in 30d
                </p>
              </div>
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Qualified + opps</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {repPerformanceById.get(rep.id)?.qualifiedLeads}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {repPerformanceById.get(rep.id)?.openOpportunities} open opportunities
                </p>
              </div>
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatCurrency(repPerformanceById.get(rep.id)?.pipelineValueCents ?? 0)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Weighted {formatCurrency(repPerformanceById.get(rep.id)?.weightedForecastValueCents ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Win rate</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {repPerformanceById.get(rep.id)?.winRatePercent ?? 0}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(repPerformanceById.get(rep.id)?.closedWonValueCents ?? 0)} won
                </p>
              </div>
            </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link className="hover:text-primary transition-colors" href={`/admin/reps/${rep.id}`}>
                  <h2 className="text-card text-foreground">{rep.displayName}</h2>
                </Link>
                <TVBadge variant={rep.isActive ? 'success' : 'default'}>
                  {rep.isActive ? 'Active' : 'Inactive'}
                </TVBadge>
                <TVBadge variant={rep.inviteStatus === 'accepted' ? 'success' : 'accent'}>
                  {rep.inviteStatus === 'accepted'
                    ? 'Invite accepted'
                    : rep.inviteStatus === 'pending'
                      ? 'Invite pending'
                      : 'No invite sent'}
                </TVBadge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Slug: {rep.slug} · Preview:{' '}
                <Link
                  className="text-primary hover:underline"
                  href={`/rep/${rep.slug}`}
                  target="_blank"
                >
                  /rep/{rep.slug}
                </Link>
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  Last login: {rep.lastLoginAt ? rep.lastLoginAt.toLocaleString() : 'Never'}
                </span>
                <span>
                  Invite sent:{' '}
                  {rep.invitationSentAt ? rep.invitationSentAt.toLocaleString() : 'Never'}
                </span>
                <span>Owned leads: {rep.ownedLeadCount}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={resendInviteAction}>
                <input name="repProfileId" type="hidden" value={rep.id} />
                <TVButton type="submit" variant="secondary">
                  Resend invite
                </TVButton>
              </form>
            </div>
          </div>

          <form action={updateAction} className="space-y-4">
            <input name="repProfileId" type="hidden" value={rep.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`displayName-${rep.id}`}>
                  Display Name
                </label>
                <TVInput
                  defaultValue={rep.displayName}
                  id={`displayName-${rep.id}`}
                  name="displayName"
                />
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`title-${rep.id}`}>
                  Title
                </label>
                <TVInput defaultValue={rep.title} id={`title-${rep.id}`} name="title" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`email-${rep.id}`}>
                  Email
                </label>
                <TVInput defaultValue={rep.email} id={`email-${rep.id}`} name="email" />
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`phone-${rep.id}`}>
                  Phone
                </label>
                <TVInput
                  defaultValue={rep.phone ?? ''}
                  id={`phone-${rep.id}`}
                  name="phone"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`website-${rep.id}`}>
                  Website
                </label>
                <TVInput
                  defaultValue={rep.website ?? ''}
                  id={`website-${rep.id}`}
                  name="website"
                />
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`location-${rep.id}`}>
                  Location
                </label>
                <TVInput
                  defaultValue={rep.location ?? ''}
                  id={`location-${rep.id}`}
                  name="location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor={`bio-${rep.id}`}>
                Bio
              </label>
              <TVTextarea defaultValue={rep.bio} id={`bio-${rep.id}`} name="bio" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {rep.landingPages.length
                  ? `Primary page: ${rep.landingPages[0]?.title}`
                  : 'No landing page assigned'}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    defaultChecked={rep.isActive}
                    name="isActive"
                    type="checkbox"
                    value="true"
                  />
                  Active
                </label>
                <TVButton type="submit">Save Changes</TVButton>
              </div>
            </div>
          </form>

          <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm font-medium text-foreground">Offboard rep</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deactivate and remove this rep account, then reassign owned leads, accounts, and opportunities.
            </p>

            <form action={offboardAction} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
              <input name="repProfileId" type="hidden" value={rep.id} />
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor={`reassign-${rep.id}`}>
                  Reassign to
                </label>
                <select
                  className="tv-pressable h-11 rounded-md border bg-surface px-3 text-sm text-foreground"
                  defaultValue=""
                  id={`reassign-${rep.id}`}
                  name="reassignmentRepProfileId"
                >
                  <option disabled value="">
                    Select a rep
                  </option>
                  {reps
                    .filter((candidate) => candidate.id !== rep.id && candidate.isActive)
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.displayName}
                      </option>
                    ))}
                </select>
              </div>
              <TVButton type="submit" variant="ghost">
                Delete account and reassign contacts
              </TVButton>
            </form>
          </div>
        </TVCard>
      ))}
    </div>
  );
}
