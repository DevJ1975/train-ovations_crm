'use client';

import { useState } from 'react';
import { Copy, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { TVBadge, TVButton, TVCard, TVCardTitle, TVEmptyState } from '@/components/trainovations';

interface OriginalLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  status: string;
}

interface DuplicateItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  status: string;
  createdAt: string;
  duplicateOfLeadId: string;
  original: OriginalLead | null;
}

interface DuplicateLeadsClientProps {
  duplicates: DuplicateItem[];
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

export function DuplicateLeadsClient({ duplicates: initialDuplicates }: DuplicateLeadsClientProps) {
  const [items, setItems] = useState<DuplicateItem[]>(initialDuplicates);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  function addPending(id: string) {
    setPendingIds((prev) => new Set([...prev, id]));
  }

  function removePending(id: string) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleMerge(duplicate: DuplicateItem) {
    if (!duplicate.original) return;
    addPending(duplicate.id);

    try {
      const response = await fetch(`/api/workspace/leads/${duplicate.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepLeadId: duplicate.duplicateOfLeadId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Merge failed');
      }

      setItems((prev) => prev.filter((item) => item.id !== duplicate.id));
      toast.success(
        `Merged ${duplicate.firstName} ${duplicate.lastName} into ${duplicate.original.firstName} ${duplicate.original.lastName}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not merge leads');
    } finally {
      removePending(duplicate.id);
    }
  }

  async function handleDismiss(duplicate: DuplicateItem) {
    addPending(duplicate.id);

    try {
      const response = await fetch(`/api/workspace/leads/${duplicate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateOfLeadId: null }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Dismiss failed');
      }

      setItems((prev) => prev.filter((item) => item.id !== duplicate.id));
      toast.success('Duplicate flag dismissed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not dismiss lead');
    } finally {
      removePending(duplicate.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-foreground">Duplicate Leads</h2>
        <TVBadge className="bg-warning/15 text-warning" variant="default">
          {items.length}
        </TVBadge>
      </div>

      {items.length === 0 ? (
        <TVEmptyState
          icon={<Users className="h-8 w-8" />}
          title="No duplicate leads detected"
          description="All leads in your workspace appear to be unique."
        />
      ) : (
        <div className="space-y-4">
          {items.map((duplicate) => {
            const isPending = pendingIds.has(duplicate.id);
            const original = duplicate.original;

            return (
              <TVCard key={duplicate.id} className="space-y-4 rounded-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <TVCardTitle className="text-sm">Potential duplicate pair</TVCardTitle>
                  <div className="flex items-center gap-2">
                    <TVButton
                      disabled={isPending || !original}
                      loading={isPending}
                      size="sm"
                      variant="primary"
                      onClick={() => handleMerge(duplicate)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Merge
                    </TVButton>
                    <TVButton
                      disabled={isPending}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(duplicate)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Dismiss
                    </TVButton>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Duplicate lead */}
                  <div className="rounded-[1.5rem] border border-warning/20 bg-warning/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                      Duplicate
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {duplicate.firstName} {duplicate.lastName}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{duplicate.email}</p>
                    {duplicate.company && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {duplicate.company}
                      </p>
                    )}
                    <div className="mt-3">
                      <TVBadge variant="default">{statusLabel(duplicate.status)}</TVBadge>
                    </div>
                  </div>

                  {/* Original lead */}
                  {original ? (
                    <div className="rounded-[1.5rem] border border-success/20 bg-success/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
                        Original (kept)
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {original.firstName} {original.lastName}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{original.email}</p>
                      {original.company && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {original.company}
                        </p>
                      )}
                      <div className="mt-3">
                        <TVBadge variant="default">{statusLabel(original.status)}</TVBadge>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 p-4 text-sm text-muted-foreground">
                      Original lead no longer exists.
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Merging will transfer all notes and activities from the duplicate to the original
                  lead, then permanently delete the duplicate.
                </p>
              </TVCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
