'use client';

import { useState, useTransition } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

import { TVBadge, TVButton, TVCard, TVCardTitle } from '@/components/trainovations';
import type { ProposalDetail } from '@/lib/services/proposal-service';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'executiveSummary'
  | 'aboutUs'
  | 'scopeOfWork'
  | 'deliverables'
  | 'timeline'
  | 'pricing'
  | 'terms'
  | 'nextSteps';

const SECTION_LABELS: Record<SectionKey, string> = {
  executiveSummary: 'Executive Summary',
  aboutUs: 'About Us',
  scopeOfWork: 'Scope of Work',
  deliverables: 'Deliverables',
  timeline: 'Timeline',
  pricing: 'Pricing',
  terms: 'Terms & Conditions',
  nextSteps: 'Next Steps',
};

const SECTION_ORDER: SectionKey[] = [
  'executiveSummary',
  'aboutUs',
  'scopeOfWork',
  'deliverables',
  'timeline',
  'pricing',
  'terms',
  'nextSteps',
];

// ─── Section editor ───────────────────────────────────────────────────────────

function SectionEditor({
  proposalId,
  sectionKey,
  label,
  value,
  onSave,
  onRegenerate,
  saving,
}: {
  proposalId: string;
  sectionKey: SectionKey;
  label: string;
  value: string;
  onSave: (key: SectionKey, value: string) => void;
  onRegenerate: (key: SectionKey, current: string, instruction?: string) => Promise<void>;
  saving: boolean;
}) {
  const [text, setText] = useState(value);
  const [instruction, setInstruction] = useState('');
  const [showInstruction, setShowInstruction] = useState(false);
  const [regenerating, startRegenerate] = useTransition();
  const isDirty = text !== value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <TVButton
            className="gap-1.5"
            disabled={regenerating}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => setShowInstruction((v) => !v)}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Rewrite with AI
          </TVButton>
        </div>
      </div>

      {showInstruction && (
        <div className="flex gap-2">
          <input
            className="tv-form-input flex-1"
            placeholder="Optional: tell AI what to change (e.g. 'make it more concise')"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <TVButton
            className="shrink-0"
            disabled={regenerating}
            size="sm"
            type="button"
            onClick={() => {
              startRegenerate(async () => {
                await onRegenerate(sectionKey, text, instruction || undefined);
                setInstruction('');
                setShowInstruction(false);
              });
            }}
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Go'}
          </TVButton>
        </div>
      )}

      <textarea
        className="w-full rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        rows={sectionKey === 'terms' ? 6 : sectionKey === 'scopeOfWork' || sectionKey === 'pricing' ? 8 : 5}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {isDirty && (
        <div className="flex justify-end">
          <TVButton
            disabled={saving}
            size="sm"
            type="button"
            onClick={() => onSave(sectionKey, text)}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
          </TVButton>
        </div>
      )}
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function ProposalEditor({
  proposal,
  saveAction,
  markSentAction,
}: {
  proposal: ProposalDetail;
  saveAction: (formData: FormData) => Promise<void>;
  markSentAction: (formData: FormData) => Promise<void>;
}) {
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    executiveSummary: proposal.executiveSummary ?? '',
    aboutUs: proposal.aboutUs ?? '',
    scopeOfWork: proposal.scopeOfWork ?? '',
    deliverables: proposal.deliverables ?? '',
    timeline: proposal.timeline ?? '',
    pricing: proposal.pricing ?? '',
    terms: proposal.terms ?? '',
    nextSteps: proposal.nextSteps ?? '',
  });

  const [title, setTitle] = useState(proposal.title);
  const [generating, startGenerate] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState(proposal.aiGeneratedAt);

  const isEmpty = !Object.values(sections).some((v) => v.trim());

  async function handleGenerateAll() {
    setError(null);
    startGenerate(async () => {
      const res = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        proposal?: Record<SectionKey, string> & { title: string };
        error?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Generation failed');
        return;
      }

      if (data.proposal) {
        setTitle(data.proposal.title);
        setSections({
          executiveSummary: data.proposal.executiveSummary ?? '',
          aboutUs: data.proposal.aboutUs ?? '',
          scopeOfWork: data.proposal.scopeOfWork ?? '',
          deliverables: data.proposal.deliverables ?? '',
          timeline: data.proposal.timeline ?? '',
          pricing: data.proposal.pricing ?? '',
          terms: data.proposal.terms ?? '',
          nextSteps: data.proposal.nextSteps ?? '',
        });
        setLastGenerated(new Date());
      }
    });
  }

  async function handleRegenerateSection(
    key: SectionKey,
    current: string,
    instruction?: string,
  ) {
    setError(null);
    const res = await fetch('/api/proposals/regenerate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: proposal.id,
        sectionKey: key,
        currentContent: current,
        instruction,
      }),
    });
    const data = (await res.json()) as { success?: boolean; content?: string; error?: string };

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Section regeneration failed');
      return;
    }

    if (data.content) {
      setSections((prev) => ({ ...prev, [key]: data.content! }));
    }
  }

  async function handleSaveSection(key: SectionKey, value: string) {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.append('proposalId', proposal.id);
    fd.append('field', key);
    fd.append('value', value);
    try {
      await saveAction(fd);
      setSections((prev) => ({ ...prev, [key]: value }));
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTitle() {
    setSaving(true);
    const fd = new FormData();
    fd.append('proposalId', proposal.id);
    fd.append('field', 'title');
    fd.append('value', title);
    try {
      await saveAction(fd);
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  const isSent = proposal.status === 'sent' || proposal.status === 'accepted';
  const shareUrl = proposal.shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/proposal/${proposal.shareToken}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <TVCardTitle>Proposal Editor</TVCardTitle>
            <StatusBadge status={proposal.status} />
            {lastGenerated && (
              <TVBadge className="bg-success/10 text-success" variant="default">
                <Sparkles className="mr-1 h-3 w-3" />
                AI generated {new Date(lastGenerated).toLocaleDateString()}
              </TVBadge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isSent && (
              <TVButton
                className="gap-2"
                disabled={generating}
                type="button"
                variant={isEmpty ? 'primary' : 'secondary'}
                onClick={handleGenerateAll}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating
                  ? 'Generating...'
                  : isEmpty
                    ? 'Generate with AI'
                    : 'Regenerate all'}
              </TVButton>
            )}

            {!isSent && !isEmpty && (
              <form action={markSentAction}>
                <input name="proposalId" type="hidden" value={proposal.id} />
                <TVButton type="submit" variant="primary">
                  Mark as sent & get share link
                </TVButton>
              </form>
            )}
          </div>
        </div>

        {shareUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
            <p className="text-sm text-foreground">Share link:</p>
            <a
              className="truncate text-sm font-medium text-primary hover:underline"
              href={shareUrl}
              rel="noreferrer"
              target="_blank"
            >
              {shareUrl}
            </a>
            <TVButton
              className="ml-auto shrink-0"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
            >
              Copy
            </TVButton>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </TVCard>

      {/* Title */}
      <TVCard className="space-y-3 rounded-[2rem] border-white/60 bg-white/90">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Proposal Title</p>
          {title !== proposal.title && (
            <TVButton disabled={saving} size="sm" type="button" onClick={handleSaveTitle}>
              Save
            </TVButton>
          )}
        </div>
        <input
          className="w-full rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </TVCard>

      {/* Sections */}
      {generating && isEmpty ? (
        <TVCard className="rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Claude is writing your proposal...
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Assembling CRM context, meeting history, and notes to generate a tailored proposal.
              This takes about 15–30 seconds.
            </p>
          </div>
        </TVCard>
      ) : (
        <TVCard className="space-y-8 rounded-[2rem] border-white/60 bg-white/90">
          {SECTION_ORDER.map((key) => (
            <SectionEditor
              key={key}
              label={SECTION_LABELS[key]}
              onRegenerate={handleRegenerateSection}
              onSave={handleSaveSection}
              proposalId={proposal.id}
              saving={saving}
              sectionKey={key}
              value={sections[key]}
            />
          ))}
        </TVCard>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    draft: '',
    sent: 'bg-primary/10 text-primary',
    accepted: 'bg-success/15 text-success',
    declined: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
  };

  return (
    <TVBadge className={tones[status] ?? ''} variant="default">
      {labels[status] ?? status}
    </TVBadge>
  );
}
