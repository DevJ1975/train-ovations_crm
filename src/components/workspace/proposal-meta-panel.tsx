'use client';

import { useState } from 'react';
import { TVButton, TVInput, TVTextarea } from '@/components/trainovations';
import type { ProposalEngineData } from './proposal-engine-builder';

interface Props {
  proposal: ProposalEngineData;
  onSave: (meta: Partial<ProposalEngineData>) => Promise<void>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProposalMetaPanel({ proposal, onSave }: Props) {
  const [form, setForm] = useState({
    clientName: proposal.clientName ?? '',
    clientEmail: proposal.clientEmail ?? '',
    clientCompany: proposal.clientCompany ?? '',
    brandColor: proposal.brandColor ?? '#1a56db',
    footerText: proposal.footerText ?? '',
    coverImageUrl: proposal.coverImageUrl ?? '',
    schedulingUrl: proposal.schedulingUrl ?? '',
    expiresAt: proposal.expiresAt ? proposal.expiresAt.split('T')[0] : '',
    paymentType: proposal.paymentType ?? 'none',
    depositPercent: String(proposal.depositPercent ?? 25),
    totalValueCents: String(Math.round((proposal.totalValueCents ?? 0) / 100)),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      clientName: form.clientName || undefined,
      clientEmail: form.clientEmail || undefined,
      clientCompany: form.clientCompany || undefined,
      brandColor: form.brandColor || undefined,
      footerText: form.footerText || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      schedulingUrl: form.schedulingUrl || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      paymentType: form.paymentType as ProposalEngineData['paymentType'],
      depositPercent: form.paymentType === 'deposit' ? parseInt(form.depositPercent) || 25 : undefined,
      totalValueCents: parseFloat(form.totalValueCents) ? Math.round(parseFloat(form.totalValueCents) * 100) : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-xl space-y-6 rounded-xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold">Proposal Settings</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Client Info</h3>
        <Field label="Client Name"><TVInput value={form.clientName} placeholder="Jane Smith" onChange={set('clientName')} /></Field>
        <Field label="Client Email"><TVInput type="email" value={form.clientEmail} placeholder="jane@company.com" onChange={set('clientEmail')} /></Field>
        <Field label="Client Company"><TVInput value={form.clientCompany} placeholder="Acme Corp" onChange={set('clientCompany')} /></Field>
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Branding</h3>
        <Field label="Brand Color">
          <div className="flex items-center gap-2">
            <input className="h-9 w-14 cursor-pointer rounded border border-border p-1" type="color" value={form.brandColor} onChange={set('brandColor')} />
            <TVInput className="flex-1" value={form.brandColor} placeholder="#1a56db" onChange={set('brandColor')} />
          </div>
        </Field>
        <Field label="Cover Image URL" hint="Shown at the top of the client-facing proposal">
          <TVInput value={form.coverImageUrl} placeholder="https://…" onChange={set('coverImageUrl')} />
        </Field>
        <Field label="Footer Text">
          <TVTextarea rows={2} value={form.footerText} placeholder="Confidential · © 2026 Trainovations" onChange={set('footerText')} />
        </Field>
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment & Pricing</h3>
        <Field label="Total Value">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <TVInput className="pl-7" type="number" value={form.totalValueCents} min={0} step={0.01} onChange={set('totalValueCents')} />
          </div>
        </Field>
        <Field label="Payment Type">
          <select className="tv-form-select" value={form.paymentType} onChange={set('paymentType')}>
            <option value="none">No payment (sign only)</option>
            <option value="full">Full payment on sign</option>
            <option value="deposit">Deposit on sign</option>
          </select>
        </Field>
        {form.paymentType === 'deposit' && (
          <Field label="Deposit Percentage">
            <div className="relative">
              <TVInput className="pr-7" type="number" value={form.depositPercent} min={1} max={99} onChange={set('depositPercent')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </Field>
        )}
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Scheduling & Expiry</h3>
        <Field label="Scheduling URL" hint="Calendly, Cal.com, or any booking link">
          <TVInput value={form.schedulingUrl} placeholder="https://calendly.com/…" onChange={set('schedulingUrl')} />
        </Field>
        <Field label="Expiry Date" hint="Proposal auto-expires after this date">
          <TVInput type="date" value={form.expiresAt} onChange={set('expiresAt')} />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <TVButton disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Settings'}
        </TVButton>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
      </div>
    </div>
  );
}
