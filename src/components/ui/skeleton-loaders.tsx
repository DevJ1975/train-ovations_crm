import { Skeleton } from './skeleton';

// ─── Shared pieces ────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Eyebrow + title + description */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 flex-1 min-w-48" />
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-16" />
        ))}
      </div>
    </div>
  );
}

// ─── Accounts skeleton ────────────────────────────────────────────────────────

function AccountCardSkeleton() {
  return (
    <div className="rounded-xl border bg-surface-muted/40 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="border-t border-border/40 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function AccountsPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        <FilterBar />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AccountCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Opportunities skeleton ───────────────────────────────────────────────────

function OpportunityCardSkeleton() {
  return (
    <div className="rounded-xl border bg-surface-muted/40 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="flex justify-end pt-1 border-t border-border/40">
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  );
}

export function OpportunitiesPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        {/* Search */}
        <Skeleton className="h-10 w-full" />
        {/* Metrics row */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-surface-muted/40 px-4 py-3 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        {/* Stage group */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Notes skeleton ───────────────────────────────────────────────────────────

function NoteRowSkeleton() {
  return (
    <div className="rounded-xl border bg-surface-muted/40 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function NotesPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        {/* New note card */}
        <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-9 w-24" />
        </div>
        {/* Notes list */}
        <div className="space-y-4">
          <div className="space-y-4">
            <FilterBar />
            {[1, 2, 3].map((i) => (
              <NoteRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Proposals skeleton ───────────────────────────────────────────────────────

function ProposalRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-surface-muted/40 px-5 py-4">
      <div className="min-w-0 space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function ProposalsPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* Header + CTA */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-9 w-32 shrink-0" />
          </div>
        </div>
        <FilterBar />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <ProposalRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Account detail skeleton ──────────────────────────────────────────────────

export function AccountDetailPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        {/* Header card */}
        <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-surface-muted/40 p-3 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        {/* Contacts + Deals grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[2rem] border bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="rounded-xl border bg-surface-muted/40 px-4 py-3 flex justify-between items-center gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Notes + Proposals grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[2rem] border bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
              {[1, 2].map((j) => (
                <div key={j} className="rounded-xl border bg-surface-muted/40 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Reports skeleton ─────────────────────────────────────────────────────────

export function ReportsPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border bg-surface-muted/40 p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Pipeline + Trend */}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" style={{ width: `${100 - i * 15}%` }} />
              </div>
            ))}
          </div>
          <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-8 w-24 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
            {/* Bar chart placeholder */}
            <div className="flex items-end gap-2 h-20">
              {[40, 65, 30, 80, 55, 70].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-surface-muted/40 p-2 space-y-1 text-center">
                  <Skeleton className="h-3 w-16 mx-auto" />
                  <Skeleton className="h-5 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Activity + Funnel */}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border bg-surface-muted/40 p-4 space-y-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" style={{ width: `${100 - i * 18}%` }} />
              </div>
            ))}
          </div>
        </div>
        {/* Timeline */}
        <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0 mt-1" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Opportunity detail skeleton ──────────────────────────────────────────────

export function OpportunityDetailPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader />
        {/* Header card */}
        <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-56" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-surface-muted/40 p-3 space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
        </div>
        {/* Notes + Proposals */}
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[2rem] border bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="rounded-xl border bg-surface-muted/40 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Account context */}
        <div className="rounded-[2rem] border bg-surface p-6 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-surface-muted/40 px-4 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Tasks skeleton ───────────────────────────────────────────────────────────

export function TasksPageSkeleton() {
  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader />
        {/* Header card */}
        <div className="rounded-xl border bg-surface-muted/40 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
        </div>
        {/* Task cards */}
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-surface-muted/40 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ─── Admin Rep detail skeleton ────────────────────────────────────────────────

export function AdminRepDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Profile card */}
      <div className="rounded-xl border bg-surface p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 rounded-xl" />
      </div>
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Leads + Accounts grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-surface p-6 space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center justify-between rounded-xl border bg-surface-muted/40 px-4 py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Opportunities */}
      <div className="rounded-xl border bg-surface p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border bg-surface-muted/40 px-4 py-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin list skeletons (used inside admin layout, not standalone pages) ────

function AdminListRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-surface-muted/40 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function AdminLeadsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="rounded-xl border bg-surface p-5 space-y-4">
        <Skeleton className="h-5 w-16" />
        <div className="grid gap-3 lg:grid-cols-4">
          <Skeleton className="h-10 rounded-xl lg:col-span-1" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
      <div className="rounded-xl border bg-surface p-5 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AdminListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminOpportunitiesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-surface-muted/40 px-4 py-3 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-surface p-5 space-y-4">
        <Skeleton className="h-10 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 rounded-xl border bg-surface-muted/40 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminAccountDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Account header card */}
      <div className="rounded-xl border bg-surface p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Contacts + Opportunities grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-surface p-6 space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-44" />
            </div>
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between rounded-xl border bg-surface-muted/40 px-4 py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Account meta */}
      <div className="rounded-xl border bg-surface p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-surface-muted/40 px-4 py-3 space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
