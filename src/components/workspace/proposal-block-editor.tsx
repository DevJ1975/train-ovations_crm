'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TVButton, TVInput, TVTextarea } from '@/components/trainovations';
import type { ProposalBlock, ProposalPackage } from './proposal-engine-builder';

interface Props {
  block: ProposalBlock;
  proposalPackages: ProposalPackage[];
  onUpdate: (content: Record<string, unknown>) => Promise<void>;
}

// ─── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// ─── Block-specific editors ────────────────────────────────────────────────────

function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <TVInput value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
      </Field>
      <Field label="Subheading">
        <TVTextarea rows={2} value={String(content.subheading ?? '')} onChange={(e) => onChange({ ...content, subheading: e.target.value })} />
      </Field>
      <Field label="CTA Button Text">
        <TVInput value={String(content.ctaText ?? '')} placeholder="e.g. View Proposal" onChange={(e) => onChange({ ...content, ctaText: e.target.value })} />
      </Field>
      <Field label="Background Image URL">
        <TVInput value={String(content.backgroundImageUrl ?? '')} placeholder="https://…" onChange={(e) => onChange({ ...content, backgroundImageUrl: e.target.value })} />
      </Field>
    </div>
  );
}

function RichTextEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <Field label="HTML Content">
      <TVTextarea
        className="font-mono text-xs"
        rows={8}
        value={String(content.html ?? '')}
        onChange={(e) => onChange({ ...content, html: e.target.value })}
      />
      <p className="mt-1 text-xs text-muted-foreground">Accepts HTML. Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.</p>
    </Field>
  );
}

function TestimonialEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Quote">
        <TVTextarea rows={3} value={String(content.quote ?? '')} onChange={(e) => onChange({ ...content, quote: e.target.value })} />
      </Field>
      <Field label="Author Name">
        <TVInput value={String(content.authorName ?? '')} onChange={(e) => onChange({ ...content, authorName: e.target.value })} />
      </Field>
      <Field label="Author Title">
        <TVInput value={String(content.authorTitle ?? '')} onChange={(e) => onChange({ ...content, authorTitle: e.target.value })} />
      </Field>
      <Field label="Author Company">
        <TVInput value={String(content.authorCompany ?? '')} onChange={(e) => onChange({ ...content, authorCompany: e.target.value })} />
      </Field>
      <Field label="Rating (1–5)">
        <TVInput max={5} min={1} type="number" value={String(content.rating ?? 5)} onChange={(e) => onChange({ ...content, rating: parseInt(e.target.value) })} />
      </Field>
    </div>
  );
}

function ProblemSolutionEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <Field label="Problem Title">
          <TVInput value={String(content.problemTitle ?? '')} onChange={(e) => onChange({ ...content, problemTitle: e.target.value })} />
        </Field>
        <Field label="Problem Description">
          <TVTextarea rows={4} value={String(content.problemDescription ?? '')} onChange={(e) => onChange({ ...content, problemDescription: e.target.value })} />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Solution Title">
          <TVInput value={String(content.solutionTitle ?? '')} onChange={(e) => onChange({ ...content, solutionTitle: e.target.value })} />
        </Field>
        <Field label="Solution Description">
          <TVTextarea rows={4} value={String(content.solutionDescription ?? '')} onChange={(e) => onChange({ ...content, solutionDescription: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function ListItemsEditor({ items, onChange, placeholder = 'Item', maxItems = 20 }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <TVInput
            className="flex-1"
            placeholder={`${placeholder} ${i + 1}`}
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <TVButton size="sm" variant="ghost" onClick={() => onChange([...items, ''])}>
          <Plus size={12} className="mr-1" /> Add item
        </TVButton>
      )}
    </div>
  );
}

function DeliverablesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ title: string; description?: string }>) ?? [];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <TVInput
              className="flex-1 text-sm"
              placeholder="Title"
              value={item.title}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, title: e.target.value };
                onChange({ ...content, items: next });
              }}
            />
            <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...content, items: items.filter((_, idx) => idx !== i) })}>
              <Trash2 size={13} />
            </button>
          </div>
          <TVInput
            placeholder="Description (optional)"
            value={item.description ?? ''}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, description: e.target.value };
              onChange({ ...content, items: next });
            }}
          />
        </div>
      ))}
      <TVButton size="sm" variant="ghost" onClick={() => onChange({ ...content, items: [...items, { title: '', description: '' }] })}>
        <Plus size={12} className="mr-1" /> Add deliverable
      </TVButton>
    </div>
  );
}

function TimelineEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const phases = (content.phases as Array<{ title: string; description?: string; duration?: string; startOffset?: string }>) ?? [];
  return (
    <div className="space-y-3">
      {phases.map((phase, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <TVInput className="flex-1" placeholder="Phase title" value={phase.title} onChange={(e) => {
              const next = [...phases]; next[i] = { ...phase, title: e.target.value }; onChange({ ...content, phases: next });
            }} />
            <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...content, phases: phases.filter((_, idx) => idx !== i) })}>
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TVInput placeholder="Start (e.g. Week 1)" value={phase.startOffset ?? ''} onChange={(e) => {
              const next = [...phases]; next[i] = { ...phase, startOffset: e.target.value }; onChange({ ...content, phases: next });
            }} />
            <TVInput placeholder="Duration (e.g. 2 weeks)" value={phase.duration ?? ''} onChange={(e) => {
              const next = [...phases]; next[i] = { ...phase, duration: e.target.value }; onChange({ ...content, phases: next });
            }} />
          </div>
          <TVInput placeholder="Description" value={phase.description ?? ''} onChange={(e) => {
            const next = [...phases]; next[i] = { ...phase, description: e.target.value }; onChange({ ...content, phases: next });
          }} />
        </div>
      ))}
      <TVButton size="sm" variant="ghost" onClick={() => onChange({ ...content, phases: [...phases, { title: '', description: '', duration: '', startOffset: '' }] })}>
        <Plus size={12} className="mr-1" /> Add phase
      </TVButton>
    </div>
  );
}

function FaqEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ question: string; answer: string }>) ?? [];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex gap-2">
            <TVInput className="flex-1" placeholder="Question" value={item.question} onChange={(e) => {
              const next = [...items]; next[i] = { ...item, question: e.target.value }; onChange({ ...content, items: next });
            }} />
            <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...content, items: items.filter((_, idx) => idx !== i) })}>
              <Trash2 size={13} />
            </button>
          </div>
          <TVTextarea rows={2} placeholder="Answer" value={item.answer} onChange={(e) => {
            const next = [...items]; next[i] = { ...item, answer: e.target.value }; onChange({ ...content, items: next });
          }} />
        </div>
      ))}
      <TVButton size="sm" variant="ghost" onClick={() => onChange({ ...content, items: [...items, { question: '', answer: '' }] })}>
        <Plus size={12} className="mr-1" /> Add FAQ item
      </TVButton>
    </div>
  );
}

function CtaEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading"><TVInput value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} /></Field>
      <Field label="Subheading"><TVInput value={String(content.subheading ?? '')} onChange={(e) => onChange({ ...content, subheading: e.target.value })} /></Field>
      <Field label="Button Text"><TVInput value={String(content.buttonText ?? '')} onChange={(e) => onChange({ ...content, buttonText: e.target.value })} /></Field>
      <Field label="Button Action">
        <select className="tv-form-select text-sm" value={String(content.buttonAction ?? 'scroll_to_signature')} onChange={(e) => onChange({ ...content, buttonAction: e.target.value })}>
          <option value="scroll_to_signature">Scroll to Signature</option>
          <option value="scroll_to_payment">Scroll to Payment</option>
          <option value="scroll_to_scheduling">Scroll to Scheduling</option>
          <option value="external_url">External URL</option>
        </select>
      </Field>
      {content.buttonAction === 'external_url' && (
        <Field label="URL"><TVInput value={String(content.buttonUrl ?? '')} placeholder="https://…" onChange={(e) => onChange({ ...content, buttonUrl: e.target.value })} /></Field>
      )}
    </div>
  );
}

function SignatureEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Instruction Text">
        <TVTextarea rows={2} value={String(content.instruction ?? '')} onChange={(e) => onChange({ ...content, instruction: e.target.value })} />
      </Field>
      <Field label="Agreement / Terms Text">
        <TVTextarea rows={4} value={String(content.agreementText ?? '')} placeholder="By signing below, you agree to..." onChange={(e) => onChange({ ...content, agreementText: e.target.value })} />
      </Field>
    </div>
  );
}

function SchedulingEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading"><TVInput value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} /></Field>
      <Field label="Description"><TVTextarea rows={2} value={String(content.description ?? '')} onChange={(e) => onChange({ ...content, description: e.target.value })} /></Field>
      <Field label="Scheduling URL (Calendly / Cal.com)">
        <TVInput value={String(content.schedulingUrl ?? '')} placeholder="https://calendly.com/…" onChange={(e) => onChange({ ...content, schedulingUrl: e.target.value })} />
      </Field>
      <Field label="Embed Type">
        <select className="tv-form-select text-sm" value={String(content.embedType ?? 'link')} onChange={(e) => onChange({ ...content, embedType: e.target.value })}>
          <option value="link">Button link only</option>
          <option value="iframe">Embedded iframe</option>
        </select>
      </Field>
    </div>
  );
}

function RoiEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const metrics = (content.metrics as Array<{ label: string; value: string; description?: string }>) ?? [];
  return (
    <div className="space-y-3">
      <Field label="Section Headline">
        <TVInput value={String(content.headline ?? '')} onChange={(e) => onChange({ ...content, headline: e.target.value })} />
      </Field>
      {metrics.map((m, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
          <TVInput placeholder="Label (e.g. ROI)" value={m.label} onChange={(e) => { const n = [...metrics]; n[i] = { ...m, label: e.target.value }; onChange({ ...content, metrics: n }); }} />
          <TVInput placeholder="Value (e.g. 3x)" value={m.value} onChange={(e) => { const n = [...metrics]; n[i] = { ...m, value: e.target.value }; onChange({ ...content, metrics: n }); }} />
          <TVInput className="col-span-2" placeholder="Description" value={m.description ?? ''} onChange={(e) => { const n = [...metrics]; n[i] = { ...m, description: e.target.value }; onChange({ ...content, metrics: n }); }} />
          <button className="col-span-2 text-left text-xs text-destructive hover:underline" onClick={() => onChange({ ...content, metrics: metrics.filter((_, idx) => idx !== i) })}>Remove</button>
        </div>
      ))}
      <TVButton size="sm" variant="ghost" onClick={() => onChange({ ...content, metrics: [...metrics, { label: '', value: '', description: '' }] })}>
        <Plus size={12} className="mr-1" /> Add metric
      </TVButton>
    </div>
  );
}

function GenericJsonEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [raw, setRaw] = useState(JSON.stringify(content, null, 2));
  const [error, setError] = useState('');
  return (
    <div className="space-y-2">
      <TVTextarea className="font-mono text-xs" rows={10} value={raw} onChange={(e) => {
        setRaw(e.target.value);
        try { onChange(JSON.parse(e.target.value)); setError(''); } catch { setError('Invalid JSON'); }
      }} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Main block editor dispatcher ────────────────────────────────────────────

export function ProposalBlockEditor({ block, proposalPackages, onUpdate }: Props) {
  const [content, setContent] = useState(block.content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSaving(true);
      await onUpdate(content);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleChange = (newContent: Record<string, unknown>) => setContent(newContent);

  const editorProps = { content, onChange: handleChange };

  let editor: React.ReactNode;
  switch (block.blockType) {
    case 'hero': editor = <HeroEditor {...editorProps} />; break;
    case 'rich_text': editor = <RichTextEditor {...editorProps} />; break;
    case 'testimonial': editor = <TestimonialEditor {...editorProps} />; break;
    case 'problem_solution': editor = <ProblemSolutionEditor {...editorProps} />; break;
    case 'deliverables': editor = <DeliverablesEditor {...editorProps} />; break;
    case 'timeline': editor = <TimelineEditor {...editorProps} />; break;
    case 'faq': editor = <FaqEditor {...editorProps} />; break;
    case 'cta': editor = <CtaEditor {...editorProps} />; break;
    case 'signature': editor = <SignatureEditor {...editorProps} />; break;
    case 'scheduling': editor = <SchedulingEditor {...editorProps} />; break;
    case 'roi_value': editor = <RoiEditor {...editorProps} />; break;
    case 'scope': editor = (
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Included</p>
          <ListItemsEditor items={(content.included as string[]) ?? []} onChange={(items) => handleChange({ ...content, included: items })} placeholder="Included item" />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Excluded (optional)</p>
          <ListItemsEditor items={(content.excluded as string[]) ?? []} onChange={(items) => handleChange({ ...content, excluded: items })} placeholder="Excluded item" />
        </div>
      </div>
    ); break;
    case 'image': editor = (
      <div className="space-y-3">
        <Field label="Image URL"><TVInput value={String(content.imageUrl ?? '')} placeholder="https://…" onChange={(e) => handleChange({ ...content, imageUrl: e.target.value })} /></Field>
        <Field label="Caption"><TVInput value={String(content.caption ?? '')} onChange={(e) => handleChange({ ...content, caption: e.target.value })} /></Field>
        <Field label="Width">
          <select className="tv-form-select text-sm" value={String(content.width ?? 'full')} onChange={(e) => handleChange({ ...content, width: e.target.value })}>
            <option value="full">Full width</option><option value="large">Large</option><option value="medium">Medium</option>
          </select>
        </Field>
      </div>
    ); break;
    case 'video_embed': editor = (
      <div className="space-y-3">
        <Field label="Video URL (YouTube/Vimeo)"><TVInput value={String(content.videoUrl ?? '')} placeholder="https://youtube.com/watch?v=…" onChange={(e) => handleChange({ ...content, videoUrl: e.target.value })} /></Field>
        <Field label="Caption"><TVInput value={String(content.caption ?? '')} onChange={(e) => handleChange({ ...content, caption: e.target.value })} /></Field>
      </div>
    ); break;
    case 'pricing_table':
    case 'package_selector':
    case 'add_ons': editor = (
      <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
        <p>This block renders packages defined in the <strong>Packages</strong> tab.</p>
        {proposalPackages.length === 0 && <p className="mt-1 text-xs text-destructive">No packages added yet. Go to the Packages tab to add some.</p>}
      </div>
    ); break;
    case 'payment':
    case 'payment_summary': editor = (
      <div className="space-y-3">
        <Field label="Section Title"><TVInput value={String(content.title ?? 'Payment')} onChange={(e) => handleChange({ ...content, title: e.target.value })} /></Field>
        <Field label="Description"><TVTextarea rows={2} value={String(content.description ?? '')} onChange={(e) => handleChange({ ...content, description: e.target.value })} /></Field>
      </div>
    ); break;
    default: editor = <GenericJsonEditor {...editorProps} />; break;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground capitalize">{block.blockType.replace('_', ' ')} editor</span>
        <span className={`text-xs ${saving ? 'text-muted-foreground' : saved ? 'text-green-600' : 'text-transparent'}`}>
          {saving ? 'Saving…' : 'Saved ✓'}
        </span>
      </div>
      {editor}
    </div>
  );
}
