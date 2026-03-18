'use client';

import { useState } from 'react';
import { Plus, Trash2, Star, StarOff } from 'lucide-react';

import { TVButton, TVInput, TVTextarea } from '@/components/trainovations';
import type { ProposalPackage } from './proposal-engine-builder';

interface Props {
  proposalId: string;
  packages: ProposalPackage[];
  onRefresh: () => Promise<void>;
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function ProposalPackagesPanel({ proposalId, packages, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    isRecurring: false,
    recurringPeriod: 'monthly',
    isFeatured: false,
    features: [''],
    addOns: [] as Array<{ name: string; price: string; description: string; isOptional: boolean }>,
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', isRecurring: false, recurringPeriod: 'monthly', isFeatured: false, features: [''], addOns: [] });
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspace/proposals-engine/${proposalId}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          priceCents: Math.round(parseFloat(form.price) * 100),
          isRecurring: form.isRecurring,
          recurringPeriod: form.isRecurring ? form.recurringPeriod : undefined,
          isFeatured: form.isFeatured,
          features: form.features.filter(Boolean),
          addOns: form.addOns.filter((a) => a.name).map((a) => ({
            name: a.name,
            description: a.description || undefined,
            priceCents: Math.round(parseFloat(a.price || '0') * 100),
            isOptional: a.isOptional,
          })),
        }),
      });
      if (res.ok) { await onRefresh(); resetForm(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (packageId: string) => {
    await fetch(`/api/workspace/proposals-engine/${proposalId}/packages/${packageId}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Pricing Packages</h2>
        <TVButton size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} className="mr-1" /> Add Package
        </TVButton>
      </div>

      {/* Existing packages */}
      {packages.length === 0 && !showForm && (
        <p className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No packages yet. Add pricing packages to include in your proposal.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-xl border bg-white p-5 shadow-sm ${pkg.isFeatured ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
          >
            {pkg.isFeatured && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{pkg.name}</h3>
                <p className="text-xl font-bold text-primary">
                  {formatCents(pkg.priceCents)}
                  {pkg.isRecurring && <span className="text-sm font-normal text-muted-foreground">/{pkg.recurringPeriod}</span>}
                </p>
              </div>
              <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(pkg.id)}>
                <Trash2 size={14} />
              </button>
            </div>

            {pkg.features.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-green-600">✓</span> {f}
                  </li>
                ))}
              </ul>
            )}

            {pkg.addOns.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Add-ons available</p>
                {pkg.addOns.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span>{a.name}</span>
                    <span className="font-medium">{formatCents(a.priceCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h3 className="font-semibold">New Package</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Name *</label>
              <TVInput value={form.name} placeholder="e.g. Starter" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <TVInput className="pl-7" type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <TVTextarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} />
              Recurring
            </label>
            {form.isRecurring && (
              <select className="tv-form-select text-sm" value={form.recurringPeriod} onChange={(e) => setForm((f) => ({ ...f, recurringPeriod: e.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
              Featured (Most Popular)
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Features / Bullet Points</label>
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <TVInput className="flex-1" placeholder={`Feature ${i + 1}`} value={f} onChange={(e) => {
                  const next = [...form.features]; next[i] = e.target.value; setForm((fm) => ({ ...fm, features: next }));
                }} />
                <button className="text-muted-foreground hover:text-destructive" onClick={() => setForm((fm) => ({ ...fm, features: form.features.filter((_, idx) => idx !== i) }))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <TVButton size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, features: [...f.features, ''] }))}>
              <Plus size={12} className="mr-1" /> Add feature
            </TVButton>
          </div>

          <div className="flex gap-3">
            <TVButton disabled={saving || !form.name || !form.price} onClick={handleSubmit}>
              {saving ? 'Saving…' : 'Add Package'}
            </TVButton>
            <TVButton variant="ghost" onClick={resetForm}>Cancel</TVButton>
          </div>
        </div>
      )}
    </div>
  );
}
