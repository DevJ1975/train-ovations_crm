'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Star, CreditCard, Calendar, Shield } from 'lucide-react';

import { SignatureCanvas } from '@/components/proposal/signature-canvas';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Block {
  id: string;
  blockType: string;
  position: number;
  isVisible: boolean;
  content: Record<string, unknown>;
}

interface Package {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  isRecurring: boolean;
  recurringPeriod?: string | null;
  isFeatured: boolean;
  features: string[];
  addOns: Array<{ id: string; name: string; priceCents: number; isOptional: boolean; description?: string | null }>;
}

interface RepProfile {
  displayName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  slug?: string | null;
  photoUrl?: string | null;
  signatureProfile?: { companyName?: string | null; website?: string | null; logoUrl?: string | null } | null;
}

interface ProposalData {
  id: string;
  title: string;
  status: string;
  shareToken: string;
  clientName?: string | null;
  clientCompany?: string | null;
  brandColor?: string | null;
  fontFamily?: string | null;
  footerText?: string | null;
  coverImageUrl?: string | null;
  schedulingUrl?: string | null;
  paymentType: string;
  depositPercent?: number | null;
  totalValueCents?: number | null;
  expiresAt?: string | null;
  sentAt?: string | null;
  signedAt?: string | null;
  signerName?: string | null;
  paidAt?: string | null;
  blocks: Block[];
  packages: Package[];
  repProfile?: RepProfile | null;
  lead?: { firstName: string; lastName: string; company?: string | null } | null;
  account?: { name: string } | null;
  opportunity?: { name: string } | null;
}

interface Props {
  proposal: ProposalData;
  token: string;
  initialPaymentState?: 'success' | 'cancelled';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function getVideoEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return url;
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function HeroBlock({ content, brandColor }: { content: Record<string, unknown>; brandColor?: string }) {
  return (
    <div
      className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-2xl text-center"
      style={{
        background: content.backgroundImageUrl
          ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${content.backgroundImageUrl}) center/cover`
          : brandColor
          ? `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`
          : 'linear-gradient(135deg, #1a56db, #9333ea)',
      }}
    >
      <div className="px-6 text-white">
        <h1 className="text-4xl font-bold leading-tight">{String(content.heading ?? '')}</h1>
        {content.subheading && <p className="mt-3 text-lg opacity-90">{String(content.subheading)}</p>}
        {content.ctaText && (
          <a
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:opacity-90"
            href="#signature"
          >
            {String(content.ctaText)}
          </a>
        )}
      </div>
    </div>
  );
}

function RichTextBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div
      className="prose prose-gray max-w-none"
      dangerouslySetInnerHTML={{ __html: String(content.html ?? '') }}
    />
  );
}

function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const width = { full: 'w-full', large: 'max-w-2xl mx-auto', medium: 'max-w-lg mx-auto' }[String(content.width ?? 'full')] ?? 'w-full';
  return (
    <figure className={width}>
      <img alt={String(content.altText ?? '')} className="w-full rounded-xl" src={String(content.imageUrl ?? '')} />
      {content.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{String(content.caption)}</figcaption>}
    </figure>
  );
}

function VideoBlock({ content }: { content: Record<string, unknown> }) {
  const embedUrl = getVideoEmbedUrl(String(content.videoUrl ?? ''));
  return (
    <figure className="w-full">
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" className="h-full w-full" src={embedUrl} title="Video" />
      </div>
      {content.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{String(content.caption)}</figcaption>}
    </figure>
  );
}

function TestimonialBlock({ content }: { content: Record<string, unknown> }) {
  const rating = Number(content.rating ?? 0);
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-8">
      {rating > 0 && (
        <div className="mb-4 flex gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="fill-yellow-400 text-yellow-400" size={16} />
          ))}
        </div>
      )}
      <blockquote className="text-lg leading-relaxed text-foreground italic">"{String(content.quote ?? '')}"</blockquote>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600" />
        <div>
          <p className="font-semibold">{String(content.authorName ?? '')}</p>
          {(content.authorTitle || content.authorCompany) && (
            <p className="text-sm text-muted-foreground">
              {[content.authorTitle, content.authorCompany].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProblemSolutionBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-3 font-semibold text-red-700">{String(content.problemTitle ?? '')}</h3>
        <p className="text-sm leading-relaxed text-red-800/80">{String(content.problemDescription ?? '')}</p>
      </div>
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <h3 className="mb-3 font-semibold text-green-700">{String(content.solutionTitle ?? '')}</h3>
        <p className="text-sm leading-relaxed text-green-800/80">{String(content.solutionDescription ?? '')}</p>
      </div>
    </div>
  );
}

function DeliverablesBlock({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string; description?: string }>) ?? [];
  const cols = content.columns === 3 ? 'sm:grid-cols-3' : content.columns === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2';
  return (
    <div className={`grid gap-4 ${cols}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-white p-5 shadow-sm">
          <CheckCircle className="mt-0.5 shrink-0 text-green-500" size={18} />
          <div>
            <p className="font-semibold">{item.title}</p>
            {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScopeBlock({ content }: { content: Record<string, unknown> }) {
  const included = (content.included as string[]) ?? [];
  const excluded = (content.excluded as string[]) ?? [];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-3 font-semibold text-green-700">✓ Included</h3>
        <ul className="space-y-2">
          {included.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {item}
            </li>
          ))}
        </ul>
      </div>
      {excluded.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-red-600">✗ Not included</h3>
          <ul className="space-y-2">
            {excluded.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TimelineBlock({ content }: { content: Record<string, unknown> }) {
  const phases = (content.phases as Array<{ title: string; description?: string; duration?: string; startOffset?: string }>) ?? [];
  return (
    <ol className="relative border-l-2 border-primary/30 pl-6 space-y-8">
      {phases.map((phase, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary">
            {i + 1}
          </span>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{phase.title}</h3>
              {(phase.startOffset || phase.duration) && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {[phase.startOffset, phase.duration].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            {phase.description && <p className="mt-2 text-sm text-muted-foreground">{phase.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FaqBlock({ content }: { content: Record<string, unknown> }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = (content.items as Array<{ question: string; answer: string }>) ?? [];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border">
          <button
            className="flex w-full items-center justify-between gap-3 p-4 text-left font-medium hover:bg-surface-muted"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.question}
            {open === i ? <ChevronUp className="shrink-0 text-muted-foreground" size={16} /> : <ChevronDown className="shrink-0 text-muted-foreground" size={16} />}
          </button>
          {open === i && <div className="border-t border-border px-4 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</div>}
        </div>
      ))}
    </div>
  );
}

function RoiBlock({ content }: { content: Record<string, unknown> }) {
  const metrics = (content.metrics as Array<{ label: string; value: string; description?: string }>) ?? [];
  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold">{String(content.headline ?? '')}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-primary">{m.value}</p>
            <p className="mt-1 font-semibold">{m.label}</p>
            {m.description && <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaBlock({ content }: { content: Record<string, unknown> }) {
  const action = String(content.buttonAction ?? 'scroll_to_signature');
  const href = action === 'scroll_to_signature' ? '#signature'
    : action === 'scroll_to_payment' ? '#payment'
    : action === 'scroll_to_scheduling' ? '#scheduling'
    : String(content.buttonUrl ?? '#');

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-10 text-center text-white">
      <h2 className="text-2xl font-bold">{String(content.heading ?? '')}</h2>
      {content.subheading && <p className="mt-2 opacity-90">{String(content.subheading)}</p>}
      <a
        className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-gray-900 transition hover:opacity-90"
        href={href}
      >
        {String(content.buttonText ?? 'Get Started')}
      </a>
    </div>
  );
}

function PackageCards({
  packages,
  selectedId,
  selectedAddOns,
  onSelect,
  onToggleAddOn,
}: {
  packages: Package[];
  selectedId: string | null;
  selectedAddOns: Set<string>;
  onSelect: (id: string) => void;
  onToggleAddOn: (id: string) => void;
}) {
  if (packages.length === 0) return <p className="text-center text-sm text-muted-foreground">No packages defined.</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className={`relative cursor-pointer rounded-2xl border-2 bg-white p-6 shadow-sm transition ${
            selectedId === pkg.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
          } ${pkg.isFeatured ? 'lg:scale-105' : ''}`}
          onClick={() => onSelect(pkg.id)}
        >
          {pkg.isFeatured && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-bold text-white shadow">
              Most Popular
            </span>
          )}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{pkg.name}</h3>
            <div className={`h-5 w-5 rounded-full border-2 ${selectedId === pkg.id ? 'border-primary bg-primary' : 'border-border'}`}>
              {selectedId === pkg.id && <CheckCircle className="h-full w-full text-white" />}
            </div>
          </div>
          <p className="mb-1 text-3xl font-bold text-primary">
            {fmtCents(pkg.priceCents)}
          </p>
          {pkg.isRecurring && <p className="mb-4 text-sm text-muted-foreground">per {pkg.recurringPeriod}</p>}
          {pkg.description && <p className="mb-4 text-sm text-muted-foreground">{pkg.description}</p>}
          <ul className="mb-4 space-y-2">
            {pkg.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="shrink-0 text-green-500" size={14} /> {f}
              </li>
            ))}
          </ul>
          {pkg.addOns.length > 0 && selectedId === pkg.id && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Optional Add-ons</p>
              {pkg.addOns.map((addon) => (
                <label key={addon.id} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                  <input
                    checked={selectedAddOns.has(addon.id)}
                    type="checkbox"
                    onChange={(e) => { e.stopPropagation(); onToggleAddOn(addon.id); }}
                  />
                  <span className="flex-1">{addon.name}</span>
                  <span className="font-medium">+{fmtCents(addon.priceCents)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────

export function PublicProposalViewer({ proposal, token, initialPaymentState }: Props) {
  const sessionId = useRef(`sess_${Math.random().toString(36).slice(2)}`);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [signState, setSignState] = useState<'idle' | 'signing' | 'done'>('idle');
  const [signForm, setSignForm] = useState({ name: proposal.clientName ?? '', email: '', title: '' });
  const [signatureData, setSignatureData] = useState('');
  const [signError, setSignError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentState] = useState(initialPaymentState ?? null);
  const [declined, setDeclined] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const brandColor = proposal.brandColor ?? '#1a56db';
  const isAlreadySigned = !!proposal.signedAt;
  const isAlreadyPaid = !!proposal.paidAt;

  // Track view event
  useEffect(() => {
    fetch(`/api/public/proposal/${token}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'viewed', sessionId: sessionId.current }),
    }).catch(() => {});
  }, [token]);

  const handleToggleAddOn = (addonId: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId); else next.add(addonId);
      return next;
    });
  };

  const handleSign = async () => {
    if (!signatureData || !signForm.name || !signForm.email) {
      setSignError('Please fill in your name, email, and signature.');
      return;
    }
    setSignState('signing');
    setSignError('');
    const res = await fetch(`/api/public/proposal/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerName: signForm.name, signerEmail: signForm.email, signerTitle: signForm.title || undefined, signatureData }),
    });
    if (res.ok) {
      setSignState('done');
      fetch(`/api/public/proposal/${token}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'signed', sessionId: sessionId.current }),
      }).catch(() => {});
    } else {
      const data = await res.json();
      setSignError(data.error ?? 'Something went wrong. Please try again.');
      setSignState('idle');
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    const res = await fetch(`/api/public/proposal/${token}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedPackageId: selectedPackageId ?? undefined, selectedAddOnIds: [...selectedAddOns] }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPaymentLoading(false);
  };

  const handleDecline = async () => {
    await fetch(`/api/public/proposal/${token}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: declineReason || undefined }),
    });
    setDeclined(true);
  };

  const selectedPkg = proposal.packages.find((p) => p.id === selectedPackageId);
  const addOnTotal = [...selectedAddOns].reduce((sum, id) => {
    for (const p of proposal.packages) {
      const a = p.addOns.find((ao) => ao.id === id);
      if (a) return sum + a.priceCents;
    }
    return sum;
  }, 0);
  const totalDue = selectedPkg ? selectedPkg.priceCents + addOnTotal : (proposal.totalValueCents ?? 0);
  const depositDue = proposal.paymentType === 'deposit' && proposal.depositPercent
    ? Math.round(totalDue * (proposal.depositPercent / 100))
    : totalDue;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: proposal.fontFamily ?? undefined }}>
      {/* Success / Cancelled banners */}
      {paymentState === 'success' && (
        <div className="bg-green-600 px-4 py-3 text-center text-sm font-medium text-white">
          ✓ Payment received! Thank you — your rep will be in touch shortly.
        </div>
      )}
      {paymentState === 'cancelled' && (
        <div className="bg-yellow-500 px-4 py-3 text-center text-sm font-medium text-white">
          Payment was not completed. You can try again below.
        </div>
      )}

      {/* Cover image */}
      {proposal.coverImageUrl && (
        <div className="relative h-64 w-full overflow-hidden">
          <img alt="Proposal cover" className="h-full w-full object-cover" src={proposal.coverImageUrl} />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl font-bold text-white">{proposal.title}</h1>
          </div>
        </div>
      )}

      {/* Blocks */}
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        {!proposal.coverImageUrl && (
          <div>
            <h1 className="text-3xl font-bold">{proposal.title}</h1>
            {(proposal.clientName || proposal.clientCompany) && (
              <p className="mt-1 text-muted-foreground">
                Prepared for {[proposal.clientName, proposal.clientCompany].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}

        {proposal.blocks.map((block) => {
          if (!block.isVisible) return null;
          const { blockType, content } = block;

          switch (blockType) {
            case 'hero': return <HeroBlock key={block.id} brandColor={brandColor} content={content} />;
            case 'rich_text': return <RichTextBlock key={block.id} content={content} />;
            case 'image': return <ImageBlock key={block.id} content={content} />;
            case 'video_embed': return <VideoBlock key={block.id} content={content} />;
            case 'testimonial': return <TestimonialBlock key={block.id} content={content} />;
            case 'problem_solution': return <ProblemSolutionBlock key={block.id} content={content} />;
            case 'deliverables': return <DeliverablesBlock key={block.id} content={content} />;
            case 'scope': return <ScopeBlock key={block.id} content={content} />;
            case 'timeline': return <TimelineBlock key={block.id} content={content} />;
            case 'faq': return <FaqBlock key={block.id} content={content} />;
            case 'roi_value': return <RoiBlock key={block.id} content={content} />;
            case 'cta': return <CtaBlock key={block.id} content={content} />;
            case 'gallery': return (
              <div key={block.id} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {((content.images as Array<{ url: string; caption?: string }>) ?? []).map((img, i) => (
                  <img key={i} alt={img.caption ?? ''} className="rounded-lg object-cover" src={img.url} />
                ))}
              </div>
            );
            case 'pricing_table':
            case 'package_selector': return (
              <section key={block.id} id="packages">
                <PackageCards
                  packages={proposal.packages}
                  selectedAddOns={selectedAddOns}
                  selectedId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                  onToggleAddOn={handleToggleAddOn}
                />
              </section>
            );
            case 'scheduling': return (
              <section key={block.id} id="scheduling" className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
                <Calendar className="mx-auto mb-3 text-primary" size={28} />
                <h2 className="text-xl font-bold">{String(content.heading ?? 'Schedule a Call')}</h2>
                {content.description && <p className="mt-2 text-muted-foreground">{String(content.description)}</p>}
                {(content.schedulingUrl || proposal.schedulingUrl) && (
                  content.embedType === 'iframe' ? (
                    <iframe
                      className="mt-4 h-[500px] w-full rounded-xl border border-border"
                      src={String(content.schedulingUrl || proposal.schedulingUrl)}
                      title="Schedule a meeting"
                    />
                  ) : (
                    <a
                      className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:opacity-90"
                      href={String(content.schedulingUrl || proposal.schedulingUrl)}
                      rel="noreferrer"
                      target="_blank"
                      onClick={() => fetch(`/api/public/proposal/${token}/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'scheduling_opened', sessionId: sessionId.current }) }).catch(() => {})}
                    >
                      Schedule Now
                    </a>
                  )
                )}
              </section>
            );
            case 'signature': return (
              <section key={block.id} id="signature" className="rounded-2xl border border-border bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="text-primary" size={22} />
                  <h2 className="text-xl font-bold">Accept & Sign</h2>
                </div>

                {isAlreadySigned || signState === 'done' ? (
                  <div className="rounded-xl bg-green-50 p-6 text-center">
                    <CheckCircle className="mx-auto mb-2 text-green-600" size={28} />
                    <p className="font-semibold text-green-700">Proposal accepted and signed!</p>
                    {proposal.signerName && <p className="mt-1 text-sm text-muted-foreground">Signed by {proposal.signerName}</p>}
                  </div>
                ) : declined ? (
                  <div className="rounded-xl bg-red-50 p-6 text-center">
                    <p className="font-semibold text-red-700">You have declined this proposal.</p>
                    <p className="mt-1 text-sm text-muted-foreground">The rep will be notified.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.instruction && <p className="text-muted-foreground">{String(content.instruction)}</p>}
                    {content.agreementText && (
                      <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
                        {String(content.agreementText)}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Full Name *</label>
                        <input className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Jane Smith" value={signForm.name} onChange={(e) => setSignForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Email *</label>
                        <input className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="jane@company.com" type="email" value={signForm.email} onChange={(e) => setSignForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                      {content.requireTitle && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-medium">Title / Role</label>
                          <input className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Director of Operations" value={signForm.title} onChange={(e) => setSignForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Signature *</label>
                      <SignatureCanvas onCapture={setSignatureData} />
                    </div>
                    {signError && <p className="text-sm text-red-600">{signError}</p>}
                    <div className="flex gap-3">
                      <button
                        className="rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50 hover:opacity-90"
                        disabled={signState === 'signing'}
                        onClick={handleSign}
                      >
                        {signState === 'signing' ? 'Signing…' : 'Accept & Sign'}
                      </button>
                      <button
                        className="rounded-full border border-border px-6 py-3 text-sm text-muted-foreground hover:bg-surface-muted"
                        onClick={() => {
                          const reason = window.prompt('Reason for declining (optional):') ?? '';
                          setDeclineReason(reason);
                          handleDecline();
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
            case 'payment': return (
              <section key={block.id} id="payment" className="rounded-2xl border border-border bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="text-primary" size={22} />
                  <h2 className="text-xl font-bold">{String(content.title ?? 'Payment')}</h2>
                </div>

                {isAlreadyPaid || paymentState === 'success' ? (
                  <div className="rounded-xl bg-green-50 p-6 text-center">
                    <CheckCircle className="mx-auto mb-2 text-green-600" size={28} />
                    <p className="font-semibold text-green-700">Payment complete!</p>
                  </div>
                ) : proposal.paymentType === 'none' ? null : (
                  <div className="space-y-4">
                    {content.description && <p className="text-muted-foreground">{String(content.description)}</p>}
                    {content.showPackageSummary && selectedPkg && (
                      <div className="rounded-lg border border-border p-4">
                        <p className="font-medium">{selectedPkg.name}</p>
                        <p className="text-sm text-muted-foreground">{fmtCents(selectedPkg.priceCents)}</p>
                        {[...selectedAddOns].map((id) => {
                          for (const p of proposal.packages) {
                            const a = p.addOns.find((ao) => ao.id === id);
                            if (a) return <p key={id} className="text-sm text-muted-foreground">+ {a.name}: {fmtCents(a.priceCents)}</p>;
                          }
                          return null;
                        })}
                        <div className="mt-3 border-t border-border pt-3 font-semibold">
                          {proposal.paymentType === 'deposit' ? (
                            <>
                              <p className="text-sm text-muted-foreground">Deposit ({proposal.depositPercent}%)</p>
                              <p className="text-xl text-primary">{fmtCents(depositDue)}</p>
                            </>
                          ) : (
                            <p className="text-xl text-primary">{fmtCents(totalDue)}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-white disabled:opacity-50 hover:opacity-90"
                      disabled={paymentLoading}
                      onClick={handlePayment}
                    >
                      <CreditCard size={16} />
                      {paymentLoading ? 'Redirecting…' : `Pay ${fmtCents(depositDue)} with Stripe`}
                    </button>
                  </div>
                )}
              </section>
            );
            default: return null;
          }
        })}

        {/* Rep footer */}
        {proposal.repProfile && (
          <div className="border-t border-border pt-8 text-center">
            {proposal.repProfile.photoUrl && (
              <img alt={proposal.repProfile.displayName} className="mx-auto mb-3 h-14 w-14 rounded-full object-cover" src={proposal.repProfile.photoUrl} />
            )}
            <p className="font-semibold">{proposal.repProfile.displayName}</p>
            {proposal.repProfile.title && <p className="text-sm text-muted-foreground">{proposal.repProfile.title}</p>}
            {proposal.repProfile.signatureProfile?.companyName && (
              <p className="text-sm text-muted-foreground">{proposal.repProfile.signatureProfile.companyName}</p>
            )}
            {proposal.repProfile.email && <p className="mt-1 text-sm text-primary">{proposal.repProfile.email}</p>}
          </div>
        )}

        {/* Footer text */}
        {proposal.footerText && (
          <p className="text-center text-xs text-muted-foreground">{proposal.footerText}</p>
        )}
      </main>
    </div>
  );
}
