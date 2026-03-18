'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, ListOrdered, Plus, Search, Trash2, X } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVSectionHeader,
  TVTextarea,
} from '@/components/trainovations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SequenceStep {
  id: string;
  stepNumber: number;
  delayDays: number;
  subject: string | null;
  bodyTemplate: string;
}

export interface Sequence {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: SequenceStep[];
  enrollmentCount: number;
}

interface DraftStep {
  delayDays: number;
  subject: string;
  bodyTemplate: string;
}

interface LeadOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
}

// ---------------------------------------------------------------------------
// Step builder row
// ---------------------------------------------------------------------------

function StepRow({
  index,
  step,
  onChange,
  onRemove,
}: {
  index: number;
  step: DraftStep;
  onChange: (index: number, updated: DraftStep) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border bg-surface-muted/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <TVBadge variant="default">Step {index + 1}</TVBadge>
        <button
          aria-label="Remove step"
          className="rounded-lg border border-transparent p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          type="button"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Day (delay)</label>
          <TVInput
            min={0}
            placeholder="e.g. 3"
            type="number"
            value={step.delayDays}
            onChange={(e) =>
              onChange(index, { ...step, delayDays: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Subject (optional)</label>
          <TVInput
            placeholder="e.g. Quick follow-up for {{firstName}}"
            value={step.subject}
            onChange={(e) => onChange(index, { ...step, subject: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Message template
          <span className="ml-2 font-normal text-muted-foreground/70">
            use {'{'}{'{'}'firstNamer{'}'}{'}'}}, {'{'}{'{'}'company'{'}'}{'}'}
          </span>
        </label>
        <TVTextarea
          placeholder={`Hi {{firstName}},\n\nJust wanted to follow up on your interest in training programs...`}
          rows={4}
          value={step.bodyTemplate}
          onChange={(e) => onChange(index, { ...step, bodyTemplate: e.target.value })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New sequence inline form
// ---------------------------------------------------------------------------

function NewSequenceForm({ onCreated }: { onCreated: (seq: Sequence) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([
    { delayDays: 1, subject: '', bodyTemplate: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { delayDays: (prev[prev.length - 1]?.delayDays ?? 0) + 3, subject: '', bodyTemplate: '' },
    ]);

  const updateStep = useCallback((index: number, updated: DraftStep) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Sequence name is required.');
      return;
    }

    const invalidStep = steps.find((s) => !s.bodyTemplate.trim());
    if (invalidStep) {
      setError('All steps must have a message template.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/workspace/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          steps: steps.map((s) => ({
            delayDays: s.delayDays,
            subject: s.subject.trim() || undefined,
            bodyTemplate: s.bodyTemplate,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create sequence.');
        return;
      }

      onCreated(data.sequence);
      setName('');
      setDescription('');
      setSteps([{ delayDays: 1, subject: '', bodyTemplate: '' }]);
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TVCard className="space-y-5 rounded-[2rem] border-primary/20 bg-primary/5">
      <div>
        <TVCardTitle>New sequence</TVCardTitle>
        <TVCardDescription>
          Build a time-delayed drip sequence and enroll leads to automate follow-up.
        </TVCardDescription>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Sequence name</label>
          <TVInput
            placeholder="e.g. Post-event follow-up"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Description{' '}
            <span className="font-normal text-muted-foreground/70">(optional)</span>
          </label>
          <TVInput
            placeholder="Short description of this sequence's purpose"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Steps</p>
        {steps.map((step, i) => (
          <StepRow
            key={i}
            index={i}
            step={step}
            onChange={updateStep}
            onRemove={removeStep}
          />
        ))}
        <TVButton size="sm" type="button" variant="ghost" onClick={addStep}>
          <Plus className="h-4 w-4" />
          Add step
        </TVButton>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <TVButton loading={saving} size="sm" type="button" onClick={handleSave}>
          Save sequence
        </TVButton>
      </div>
    </TVCard>
  );
}

// ---------------------------------------------------------------------------
// Enroll lead mini panel
// ---------------------------------------------------------------------------

function EnrollLeadPanel({
  sequenceId,
  onEnrolled,
}: {
  sequenceId: string;
  onEnrolled: () => void;
}) {
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setLeads([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch('/api/workspace/leads');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.leads as LeadOption[]).filter((l) => {
          const full = `${l.firstName} ${l.lastName} ${l.email} ${l.company ?? ''}`.toLowerCase();
          return full.includes(q.toLowerCase());
        });
        setLeads(filtered.slice(0, 8));
      }
    } finally {
      setSearching(false);
    }
  };

  const enroll = async (leadId: string) => {
    setEnrolling(leadId);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspace/sequences/${sequenceId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Lead enrolled successfully.');
        setLeads([]);
        setQuery('');
        onEnrolled();
      } else {
        setMessage(data.error ?? 'Failed to enroll lead.');
      }
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-surface p-4">
      <p className="text-sm font-medium text-foreground">Enroll a lead</p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <TVInput
          className="pl-9"
          placeholder="Search leads by name, email, or company..."
          value={query}
          onChange={(e) => search(e.target.value)}
        />
      </div>

      {searching ? (
        <p className="text-sm text-muted-foreground">Searching...</p>
      ) : leads.length > 0 ? (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-surface-muted/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {lead.company ? `${lead.company} · ` : ''}
                  {lead.email}
                </p>
              </div>
              <TVButton
                loading={enrolling === lead.id}
                size="sm"
                variant="secondary"
                onClick={() => enroll(lead.id)}
              >
                Enroll
              </TVButton>
            </div>
          ))}
        </div>
      ) : query.length >= 2 ? (
        <p className="text-sm text-muted-foreground">No leads match your search.</p>
      ) : null}

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sequence card
// ---------------------------------------------------------------------------

function SequenceCard({
  sequence,
  onToggleActive,
  onDelete,
}: {
  sequence: Sequence;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(sequence.enrollmentCount);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleActive(sequence.id, !sequence.isActive);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete sequence "${sequence.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(sequence.id);
    setDeleting(false);
  };

  return (
    <div className="rounded-2xl border bg-surface-muted/60 p-5 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{sequence.name}</p>
            <TVBadge
              className={
                sequence.isActive
                  ? 'bg-success/15 text-success'
                  : 'bg-surface-muted text-muted-foreground'
              }
              variant="default"
            >
              {sequence.isActive ? 'Active' : 'Inactive'}
            </TVBadge>
          </div>
          {sequence.description ? (
            <p className="text-sm text-muted-foreground">{sequence.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-muted-foreground">
              {sequence.steps.length} {sequence.steps.length === 1 ? 'step' : 'steps'}
            </span>
            <span className="text-xs text-border">·</span>
            <span className="text-xs text-muted-foreground">{enrollmentCount} enrolled</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TVButton
            loading={toggling}
            size="sm"
            variant="ghost"
            onClick={handleToggle}
          >
            {sequence.isActive ? 'Deactivate' : 'Activate'}
          </TVButton>
          <TVButton
            size="sm"
            variant="secondary"
            onClick={() => setShowEnroll((v) => !v)}
          >
            Enroll lead
          </TVButton>
          <button
            aria-label="Expand steps"
            className="rounded-lg border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            type="button"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <TVButton
            loading={deleting}
            size="sm"
            variant="ghost"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Delete sequence</span>
          </TVButton>
        </div>
      </div>

      {/* Enroll panel */}
      {showEnroll ? (
        <EnrollLeadPanel
          sequenceId={sequence.id}
          onEnrolled={() => {
            setEnrollmentCount((c) => c + 1);
            setShowEnroll(false);
          }}
        />
      ) : null}

      {/* Steps expansion */}
      {expanded ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Steps
          </p>
          {sequence.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No steps configured.</p>
          ) : (
            sequence.steps.map((step) => (
              <div
                key={step.id}
                className="rounded-xl border bg-surface px-4 py-3 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TVBadge variant="default">Day {step.delayDays}</TVBadge>
                  {step.subject ? (
                    <p className="text-sm font-medium text-foreground">{step.subject}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No subject</p>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {step.bodyTemplate}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SequencesWorkspace({ sequences: initial }: { sequences: Sequence[] }) {
  const [sequences, setSequences] = useState<Sequence[]>(initial);
  const [showForm, setShowForm] = useState(false);

  const handleCreated = (seq: Sequence) => {
    setSequences((prev) => [seq, ...prev]);
    setShowForm(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/workspace/sequences/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setSequences((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive } : s)),
      );
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/workspace/sequences/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSequences((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page action bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <TVSectionHeader
            description="Automate drip outreach with time-delayed steps"
            eyebrow="Rep Tools"
            title="Follow-Up Sequences"
          />
        </div>
        <TVButton
          size="sm"
          variant={showForm ? 'ghost' : 'primary'}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Sequence
            </>
          )}
        </TVButton>
      </div>

      {/* Inline creation form */}
      {showForm ? <NewSequenceForm onCreated={handleCreated} /> : null}

      {/* Sequence list */}
      <div className="space-y-4">
        {sequences.length === 0 && !showForm ? (
          <TVCard className="rounded-[2rem] border-border/70 bg-surface">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ListOrdered className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-foreground">No sequences yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first follow-up sequence to automate drip outreach.
                </p>
              </div>
              <TVButton size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                New Sequence
              </TVButton>
            </div>
          </TVCard>
        ) : (
          sequences.map((seq) => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>
    </div>
  );
}
