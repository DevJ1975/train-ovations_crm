import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  CircleAlert,
  ExternalLink,
  FileText,
  Globe,
  ListOrdered,
  Mail,
  MapPin,
  Phone,
  PieChart,
  QrCode,
  Radar,
  Sparkles,
  Target,
  User,
  Users,
  Webhook,
} from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVSectionHeader,
} from '@/components/trainovations';
import { LogoutButton } from '@/components/auth/logout-button';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { WeatherWidget } from '@/components/ui/weather-widget';
import { QrCodePreview } from '@/components/qr/qr-code-preview';
import { CaptureBusinessCardButton } from '@/components/workspace/capture-business-card-button';
import { DismissibleAlertCard } from '@/components/workspace/dismissible-alert-card';
import { ManualLeadDialog } from '@/components/workspace/manual-lead-dialog';
import { OnboardingBanner } from '@/components/workspace/onboarding-banner';
import { SearchTriggerButton } from '@/components/workspace/search-trigger-button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import type { WorkspaceData } from '@/lib/services/workspace-service';

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getAbsolutePublicPath(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

function getActionSummary(metrics: NonNullable<WorkspaceData['repProfile']>['metrics']) {
  if (metrics.openTasks > 0) {
    return {
      title: `${metrics.openTasks} active ${metrics.openTasks === 1 ? 'task' : 'tasks'} are waiting`,
      description: 'Start in the task center to clear generated follow-up before work slips across inboxes and alerts.',
      toneClassName: 'border-primary/20 bg-primary/5',
    };
  }

  if (metrics.newLeads > 0) {
    return {
      title: `${metrics.newLeads} new ${metrics.newLeads === 1 ? 'lead' : 'leads'} need first response`,
      description: 'Start in the inbox and work the newest submissions before they age out.',
      toneClassName: 'border-primary/20 bg-primary/5',
    };
  }

  if (metrics.openAlerts > 0) {
    return {
      title: `${metrics.openAlerts} open ${metrics.openAlerts === 1 ? 'alert' : 'alerts'} need review`,
      description: 'Review movement signals and update account strategy before your next touchpoint.',
      toneClassName: 'border-accent/25 bg-accent/5',
    };
  }

  if (metrics.meetingsProcessed > 0) {
    return {
      title: `${metrics.meetingsProcessed} meeting ${metrics.meetingsProcessed === 1 ? 'brief' : 'briefs'} ready`,
      description: 'Follow up while the context is fresh and turn conversation momentum into next steps.',
      toneClassName: 'border-success/25 bg-success/5',
    };
  }

  return {
    title: 'Workspace is clear right now',
    description: 'Use your public page tools and integrations to keep the pipeline warm.',
    toneClassName: 'border-border bg-surface',
  };
}

function getRepGreeting(displayName: string, now = new Date()) {
  const hour = now.getHours();

  if (hour < 5) {
    return {
      title: `I see we are burning the midnight oil, ${displayName}`,
      description:
        'Late-night momentum still counts. Tidy the queue, follow up fast, and set tomorrow up for a strong start.',
    };
  }

  if (hour < 12) {
    return {
      title: `Good morning, ${displayName}`,
      description:
        'Start the day with your freshest leads, highest-priority alerts, and the clearest next best action.',
    };
  }

  if (hour < 17) {
    return {
      title: `Good afternoon, ${displayName}`,
      description:
        'Keep the day moving with quick responses, clean follow-up, and steady pipeline progress.',
    };
  }

  if (hour < 22) {
    return {
      title: `Good evening, ${displayName}`,
      description:
        'Close out the day with crisp follow-up, alert review, and a queue that feels lighter than it did this morning.',
    };
  }

  return {
    title: `Still making moves, ${displayName}`,
    description:
      'A focused late session can set up tomorrow’s wins. Keep the pipeline warm and the next steps clear.',
  };
}

function MetricTile({
  title,
  value,
  detail,
  href,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: number;
  detail: string;
  href: string;
  icon: typeof Users;
  accentClassName: string;
}) {
  return (
    <Link
      className={cn(
        'group rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md',
        accentClassName,
      )}
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <TVBadge className="bg-surface/80 text-foreground" variant="default">
          {title}
        </TVBadge>
        <Icon className="h-5 w-5 text-current opacity-80 transition-transform group-hover:scale-110" />
      </div>
      <div className="mt-5">
        <p className="text-4xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      </div>
    </Link>
  );
}

function QuickAction({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-surface-muted/70 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ToolLinkTile({
  title,
  detail,
  href,
  icon: Icon,
}: {
  title: string;
  detail: string;
  href: string;
  icon: typeof Users;
}) {
  return (
    <Link
      className="group rounded-2xl border bg-surface-muted/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <Icon className="h-5 w-5 text-primary opacity-80 transition-transform group-hover:scale-110" />
      </div>
    </Link>
  );
}

export function WorkspaceOverview({ workspace }: { workspace: WorkspaceData }) {
  if (workspace.destination === 'admin' || !workspace.repProfile) {
    return (
      <div className="space-y-6">
        <WeatherWidget />
        <div className="flex items-start justify-between gap-4">
          <TVSectionHeader
            eyebrow="Workspace"
            title="Signed in successfully"
            description="Your account has access to the Trainovations CRM. Continue into the admin workspace or manage your integrations."
          />
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TVCard className="space-y-4">
            <TVCardTitle>CRM admin</TVCardTitle>
            <TVCardDescription>
              Review leads, reps, and account activity from the main admin surface.
            </TVCardDescription>
            <TVButton asChild>
              <Link href="/admin">Open Admin Workspace</Link>
            </TVButton>
          </TVCard>

          <TVCard className="space-y-4">
            <TVCardTitle>Integrations</TVCardTitle>
            <TVCardDescription>
              Manage Google, Zoom, and Notion connections for automation workflows.
            </TVCardDescription>
            <TVButton asChild variant="secondary">
              <Link href="/settings/integrations">Open Integration Settings</Link>
            </TVButton>
          </TVCard>
        </div>
      </div>
    );
  }

  const rep = workspace.repProfile;
  const publicLandingUrl = rep.publicLandingPath
    ? getAbsolutePublicPath(rep.publicLandingPath)
    : null;
  const qrDownloadPath = rep.publicLandingPath
    ? `/api/rep/${rep.slug}/qr`
    : null;
  const topAlert = rep.alertFeed[0] ?? null;
  const newestLead = rep.recentLeads[0] ?? null;
  const greeting = getRepGreeting(rep.displayName);
  const actionSummary = getActionSummary(rep.metrics);

  return (
    <div className="space-y-5 sm:space-y-6">
      <WeatherWidget />
      <OnboardingBanner
        currentStep={rep.onboarding.nextStep ?? 1}
        isComplete={rep.onboarding.isComplete}
        repSlug={rep.slug}
        step1Complete={rep.onboarding.step1}
        step2Complete={rep.onboarding.step2}
        step3Complete={rep.onboarding.step3}
      />
      <div className="tv-card-hero flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <TVSectionHeader
            eyebrow="Rep Command Center"
            title={greeting.title}
            description={greeting.description}
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
            <TVButton asChild className="w-full whitespace-nowrap sm:w-auto" size="sm" variant="ghost">
              <Link href="/">Return to main page</Link>
            </TVButton>
            <TVBadge className="capitalize">{workspace.user.role.replace('_', ' ')}</TVBadge>
            <TVBadge className="bg-success/15 text-success" variant="default">
              Profile active
            </TVBadge>
            <SearchTriggerButton />
            <DarkModeToggle />
            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div
            className={cn(
              'rounded-[1.75rem] border bg-surface/80 p-5',
              actionSummary.toneClassName,
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <TVBadge className="bg-white/80 text-foreground" variant="default">
                Today
              </TVBadge>
              <p className="text-lg font-semibold text-foreground">{actionSummary.title}</p>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {actionSummary.description}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-surface-muted/60 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Next best action</p>
            </div>
            {newestLead ? (
              <>
                <p className="mt-3 truncate text-base font-semibold text-foreground">
                  Reach out to {newestLead.firstName} {newestLead.lastName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {newestLead.company ?? 'Company pending'} submitted a lead on{' '}
                  {formatDate(newestLead.createdAt)}.
                </p>
                <p className="mt-3 text-sm text-foreground">
                  Start with a fast first response, then attach any new relationship or alert context.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <TVButton asChild className="w-full sm:w-auto" size="sm">
                    <Link href="/workspace/inbox">Open Inbox</Link>
                  </TVButton>
                  <TVButton asChild className="w-full sm:w-auto" size="sm" variant="secondary">
                    <Link href="/workspace/leads">Open Lead Queue</Link>
                  </TVButton>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-base font-semibold text-foreground">
                  No immediate triage items
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Promote your landing page and keep capture channels active while the queue is clear.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          accentClassName="border-primary/20 bg-primary/5 text-primary"
          detail="Generated follow-up work that should be cleared before the queue drifts."
          href="/workspace/tasks"
          icon={Users}
          title="Open Tasks"
          value={rep.metrics.openTasks}
        />
        <MetricTile
          accentClassName="border-border bg-surface"
          detail="All contacts currently assigned to your workspace."
          href="/workspace/leads"
          icon={Globe}
          title="Assigned Leads"
          value={rep.metrics.totalLeads}
        />
        <MetricTile
          accentClassName="border-accent/25 bg-accent/5 text-accent"
          detail="Career movement and relationship signals requiring review."
          href="/workspace/alerts"
          icon={BellRing}
          title="Open Alerts"
          value={rep.metrics.openAlerts}
        />
        <MetricTile
          accentClassName="border-success/25 bg-success/5 text-success"
          detail="Processed conversations with next steps and follow-up drafts."
          href="/workspace/tasks"
          icon={CalendarClock}
          title="Meetings Ready"
          value={rep.metrics.meetingsProcessed}
        />
      </div>

      <TVCard className="space-y-6 rounded-[2rem] border-border/70 bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <TVCardTitle>Rep tools</TVCardTitle>
            <TVCardDescription>
              Keep every rep-facing workflow one click away from the command center.
            </TVCardDescription>
          </div>
          <ManualLeadDialog />
        </div>

        {/* Activity */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Activity</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ToolLinkTile
              detail="Work generated follow-up, alert review, and due next steps in one queue."
              href="/workspace/tasks"
              icon={Sparkles}
              title="Task Center"
            />
            <ToolLinkTile
              detail="See scheduled events and dated follow-up in day, week, month, and agenda views."
              href="/workspace/calendar"
              icon={CalendarClock}
              title="Calendar Workspace"
            />
            <ToolLinkTile
              detail="Open linked email threads and recent customer replies."
              href="/workspace/inbox"
              icon={Mail}
              title="Connected Inbox"
            />
            <ToolLinkTile
              detail="Review relationship and career movement signals."
              href="/workspace/alerts"
              icon={BellRing}
              title="Alert Queue"
            />
            <ToolLinkTile
              detail="Automate drip follow-up with time-delayed step sequences"
              href="/workspace/sequences"
              icon={ListOrdered}
              title="Sequences"
            />
          </div>
        </div>

        {/* Pipeline */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ToolLinkTile
              detail="Work assigned leads, meeting context, and follow-up shortcuts."
              href="/workspace/leads"
              icon={Users}
              title="Lead Queue"
            />
            <ToolLinkTile
              detail="Review accounts assigned to your profile with contacts, open deals, and pipeline value."
              href="/workspace/accounts"
              icon={Building2}
              title="Accounts"
            />
            <ToolLinkTile
              detail="Track open deals by stage, update next steps, and move pipeline forward."
              href="/workspace/opportunities"
              icon={PieChart}
              title="Pipeline"
            />
            <ToolLinkTile
              detail="Generate AI-powered proposals with SOW, pricing, and timeline."
              href="/workspace/proposals"
              icon={FileText}
              title="Proposals"
            />
          </div>
        </div>

        {/* Rep Tools */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rep Tools</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <ToolLinkTile
              detail="Open your public page for sharing, review, and live testing."
              href={rep.publicLandingPath ?? '/workspace'}
              icon={Globe}
              title="Public Page"
            />
            <ToolLinkTile
              detail="Update your name, title, bio, contact info, and profile photo."
              href="/workspace/profile"
              icon={User}
              title="My Profile"
            />
            <ToolLinkTile
              detail="Capture meeting notes, account briefs, and follow-up plans."
              href="/workspace/notes"
              icon={BookOpen}
              title="Notes"
            />
            <ToolLinkTile
              detail="Write private field notes and keep a personal journal."
              href="/workspace/journal"
              icon={FileText}
              title="Rep Journal"
            />
            <ToolLinkTile
              detail="Pipeline performance, lead funnel, and activity summary."
              href="/workspace/reports"
              icon={BarChart2}
              title="Reports"
            />
            <ToolLinkTile
              detail="Connect Google, Zoom, and Notion for rep automation coverage."
              href="/settings/integrations"
              icon={Radar}
              title="Integrations"
            />
            <ToolLinkTile
              detail="Track your monthly revenue target, closed won, and pipeline attainment."
              href="/workspace/quota"
              icon={Target}
              title="Quota"
            />
            <ToolLinkTile
              detail="Register external endpoints to receive real-time CRM event notifications."
              href="/workspace/webhooks"
              icon={Webhook}
              title="Webhooks"
            />
          </div>
        </div>
      </TVCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <TVCard className="space-y-6 rounded-[2rem] border-border/70 bg-surface p-0">
          <div className="border-b border-border/70 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Circular profile photo */}
                <Link className="shrink-0" href="/workspace/profile">
                  {rep.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={rep.displayName}
                      className="h-16 w-16 rounded-full border-2 border-primary/20 object-cover shadow-sm transition-opacity hover:opacity-80"
                      src={rep.photoUrl}
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-muted text-lg font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10">
                      {initialsFromName(rep.displayName)}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 space-y-3">
                  <TVBadge variant="accent">{rep.signatureCompany ?? 'Trainovations'}</TVBadge>
                  <div>
                    <TVCardTitle className="truncate">{rep.title}</TVCardTitle>
                    <TVCardDescription className="mt-2 max-w-2xl">{rep.bio}</TVCardDescription>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TVButton asChild size="sm" variant="secondary">
                  <Link href="/workspace/profile">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </TVButton>
                {rep.publicLandingPath ? (
                  <TVButton asChild>
                    <Link href={rep.publicLandingPath}>
                      View Public Page
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </TVButton>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border bg-surface-muted/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Contact
                </p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{rep.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    {rep.phone ?? 'Phone coming soon'}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border bg-surface-muted/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Profile
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-foreground">Slug: {rep.slug}</p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {rep.location ?? 'Location not set'}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border bg-surface-muted/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Channel status
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TVBadge className="bg-success/15 text-success" variant="default">
                    Landing page live
                  </TVBadge>
                  <TVBadge className="bg-primary/10 text-primary" variant="default">
                    QR ready
                  </TVBadge>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(210px,240px)_minmax(0,1fr)]">
              {rep.publicLandingPath ? (
                <div className="rounded-[1.5rem] border bg-surface-muted/60 p-4">
                  <QrCodePreview
                    value={publicLandingUrl ?? rep.publicLandingPath}
                    title={`${rep.displayName} landing page QR code`}
                  />
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border bg-surface-muted/60 p-5">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Public page distribution</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Share your landing page and QR assets for events, badges, follow-up emails,
                    and printed collateral.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {rep.publicLandingPath ? (
                      <TVButton asChild className="w-full sm:w-auto" size="sm" variant="secondary">
                        <Link href={rep.publicLandingPath}>
                          Open landing page
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </TVButton>
                    ) : null}
                    {qrDownloadPath ? (
                      <TVButton asChild className="w-full sm:w-auto" size="sm" variant="ghost">
                        <Link href={qrDownloadPath}>Download QR SVG</Link>
                      </TVButton>
                    ) : null}
                  </div>
                </div>

                {(() => {
                  const quickActions: { title: string; detail: string; node: ReactNode }[] = [
                    {
                      title: 'Primary queue',
                      detail: 'Start with the most recent submissions and keep response time tight.',
                      node: (
                        <TVButton asChild className="w-full justify-center">
                          <Link href="/workspace/inbox">
                            <Users className="mr-2 h-4 w-4" />
                            Open Inbox
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'Task center',
                      detail: 'Review generated next steps, due work, and follow-up recommendations.',
                      node: (
                        <TVButton asChild className="w-full justify-center" variant="secondary">
                          <Link href="/workspace/tasks">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Open Tasks
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'Calendar',
                      detail: 'Lay out your week, meeting blocks, and timed follow-up in one place.',
                      node: (
                        <TVButton asChild className="w-full justify-center" variant="secondary">
                          <Link href="/workspace/calendar">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Open Calendar
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'Lead queue',
                      detail: 'Start with the most recent submissions and keep response time tight.',
                      node: (
                        <TVButton asChild className="w-full justify-center">
                          <Link href="/workspace/leads">
                            <Users className="mr-2 h-4 w-4" />
                            Open Lead Inbox
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'Fast capture',
                      detail: 'Capture conference and field contacts from a device camera.',
                      node: (
                        <div className="w-full">
                          <CaptureBusinessCardButton />
                        </div>
                      ),
                    },
                    {
                      title: 'Alert queue',
                      detail: 'Review movement signals and align your next outbound touch.',
                      node: (
                        <TVButton asChild className="w-full justify-center" variant="secondary">
                          <Link href="/workspace/alerts">
                            <CircleAlert className="mr-2 h-4 w-4" />
                            Review Alerts
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'System health',
                      detail: 'Keep Google, Zoom, and Notion connected for automation coverage.',
                      node: (
                        <TVButton asChild className="w-full justify-center" variant="secondary">
                          <Link href="/settings/integrations">
                            <Radar className="mr-2 h-4 w-4" />
                            Manage Integrations
                          </Link>
                        </TVButton>
                      ),
                    },
                    {
                      title: 'Journal',
                      detail: 'Capture field notes and private observations.',
                      node: (
                        <TVButton asChild className="w-full justify-center" variant="secondary">
                          <Link href="/workspace/journal">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Open Journal
                          </Link>
                        </TVButton>
                      ),
                    },
                  ];

                  return (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {quickActions.map((a) => (
                        <QuickAction key={a.title} detail={a.detail} title={a.title}>
                          {a.node}
                        </QuickAction>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </TVCard>

        <div className="space-y-6 xl:sticky xl:top-6">
          <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
            <div className="flex items-center justify-between gap-3">
              <div>
                <TVCardTitle>Triage queue</TVCardTitle>
                <TVCardDescription>
                  The most important item to move right now.
                </TVCardDescription>
              </div>
              <TVBadge className="bg-primary/10 text-primary" variant="default">
                Priority
              </TVBadge>
            </div>

            {newestLead ? (
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                <p className="truncate text-sm font-medium text-foreground">
                  {newestLead.firstName} {newestLead.lastName}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {newestLead.company ?? 'Company pending'} • {newestLead.email}
                </p>
                <p className="mt-3 text-sm text-foreground">
                  Submitted {formatDate(newestLead.createdAt)}
                  {newestLead.interest ? ` with interest in ${newestLead.interest}` : '.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <TVBadge className="bg-surface text-primary" variant="default">
                    {newestLead.status.replace('_', ' ')}
                  </TVBadge>
                  <TVBadge className="bg-surface text-foreground" variant="default">
                    First response
                  </TVBadge>
                  <TVButton asChild size="sm" variant="secondary">
                    <Link href={`/workspace/leads/${newestLead.id}`}>Open lead</Link>
                  </TVButton>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
                No fresh leads are waiting right now.
              </div>
            )}

            {topAlert ? (
              <DismissibleAlertCard alert={topAlert} />
            ) : null}

          </TVCard>

          <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface" id="alerts">
            <div className="flex items-center justify-between gap-3">
              <div>
                <TVCardTitle>Priority alerts</TVCardTitle>
                <TVCardDescription>
                  Relationship and movement signals with the highest urgency.
                </TVCardDescription>
              </div>
              <TVBadge className="bg-accent/15 text-accent" variant="default">
                {rep.alertFeed.length}
              </TVBadge>
            </div>

            {rep.alertFeed.length ? (
              <div className="space-y-3">
                {rep.alertFeed.map((alert) => (
                  <DismissibleAlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
                No open movement alerts right now.
              </div>
            )}
          </TVCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Lead inbox</TVCardTitle>
              <TVCardDescription>
                Recent contacts ready for first response and follow-up.
              </TVCardDescription>
            </div>
            <TVBadge className="bg-primary/10 text-primary" variant="default">
              {rep.recentLeads.length}
            </TVBadge>
          </div>

          {rep.recentLeads.length ? (
            <div className="space-y-3">
              {rep.recentLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className={cn(
                    'rounded-[1.5rem] border p-4',
                    index === 0 ? 'border-primary/20 bg-primary/5' : 'bg-surface-muted/60',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lead.company ?? 'Company pending'}
                        {lead.interest ? ` • ${lead.interest}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </p>
                      <TVButton asChild size="sm" variant="secondary">
                        <Link href={`/workspace/leads/${lead.id}`}>Open lead</Link>
                      </TVButton>
                    </div>
                  </div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                    <TVBadge className="bg-surface text-primary" variant="default">
                      {lead.status.replace('_', ' ')}
                    </TVBadge>
                    <p className="min-w-0 truncate text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
              No assigned leads yet. Once your landing page starts capturing contacts, they will show up here.
            </div>
          )}
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface" id="meetings">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Meeting action center</TVCardTitle>
              <TVCardDescription>
                Follow-up drafts, summaries, and recommended next steps from processed meetings.
              </TVCardDescription>
            </div>
            <TVBadge className="bg-success/15 text-success" variant="default">
              {rep.recentMeetings.length}
            </TVBadge>
          </div>

          {rep.recentMeetings.length ? (
            <div className="space-y-4">
              {rep.recentMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-[1.5rem] border bg-surface-muted/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{meeting.topic}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {meeting.leadName ?? 'Lead pending'}
                        {meeting.company ? ` • ${meeting.company}` : ''}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {meeting.startAt ? formatDate(meeting.startAt) : 'Date pending'}
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-foreground">
                    {meeting.summary ?? 'Summary generation is still pending for this meeting.'}
                  </p>

                  {meeting.recommendedNextStep ? (
                    <div className="mt-3 rounded-xl border border-success/20 bg-success/5 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Next best action
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {meeting.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {meeting.actionItems.length ? (
                    <div className="mt-3 space-y-2">
                      {meeting.actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border bg-surface px-3 py-2"
                        >
                          <p className="text-sm text-foreground">{item.description}</p>
                          <TVBadge className="bg-accent/15 text-accent" variant="default">
                            {item.status}
                          </TVBadge>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {meeting.draft ? (
                    <div className="mt-3 rounded-xl border bg-surface px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Follow-up draft
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {meeting.draft.subject}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {meeting.draft.bodyText}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
              No processed meetings yet. Zoom and Google Calendar activity will show up here after meeting intelligence runs.
            </div>
          )}
        </TVCard>
      </div>
    </div>
  );
}
