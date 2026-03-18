'use client';

import { useState, useCallback, useTransition } from 'react';
import {
  Plus, Send, Eye, BarChart2, Copy, Trash2, GripVertical, ChevronDown, ChevronUp,
  Check, Settings, Palette, Package, LayoutTemplate, ExternalLink, AlertCircle,
} from 'lucide-react';

import { TVButton } from '@/components/trainovations';
import { ProposalBlockEditor } from './proposal-block-editor';
import { ProposalMetaPanel } from './proposal-meta-panel';
import { ProposalPackagesPanel } from './proposal-packages-panel';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProposalBlock {
  id: string;
  blockType: string;
  position: number;
  isVisible: boolean;
  content: Record<string, unknown>;
}

export interface ProposalPackage {
  id: string;
  name: string;
  priceCents: number;
  isRecurring: boolean;
  isFeatured: boolean;
  features: string[];
  addOns: Array<{ id: string; name: string; priceCents: number; isOptional: boolean }>;
}

export interface ProposalEngineData {
  id: string;
  title: string;
  status: string;
  shareToken: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientCompany: string | null;
  brandColor: string | null;
  footerText: string | null;
  coverImageUrl: string | null;
  schedulingUrl: string | null;
  expiresAt: string | null;
  paymentType: string;
  depositPercent: number | null;
  totalValueCents: number | null;
  blocks: ProposalBlock[];
  packages: ProposalPackage[];
}

// ─── Block Type Catalog ────────────────────────────────────────────────────────

const BLOCK_CATALOG = [
  { type: 'hero', label: 'Hero', icon: '🎯', description: 'Full-width header with CTA' },
  { type: 'rich_text', label: 'Rich Text', icon: '📝', description: 'Formatted text content' },
  { type: 'image', label: 'Image', icon: '🖼️', description: 'Single image with caption' },
  { type: 'gallery', label: 'Gallery', icon: '🎨', description: 'Multi-image grid or carousel' },
  { type: 'video_embed', label: 'Video', icon: '▶️', description: 'YouTube or Vimeo embed' },
  { type: 'testimonial', label: 'Testimonial', icon: '💬', description: 'Client quote with attribution' },
  { type: 'problem_solution', label: 'Problem / Solution', icon: '🔧', description: 'Two-column problem/solution layout' },
  { type: 'deliverables', label: 'Deliverables', icon: '✅', description: 'Icon grid of what you deliver' },
  { type: 'scope', label: 'Scope', icon: '📋', description: 'Included / excluded items' },
  { type: 'timeline', label: 'Timeline', icon: '📅', description: 'Project phase breakdown' },
  { type: 'faq', label: 'FAQ', icon: '❓', description: 'Accordion Q&A section' },
  { type: 'pricing_table', label: 'Pricing Table', icon: '💰', description: 'Package comparison table' },
  { type: 'package_selector', label: 'Package Selector', icon: '📦', description: 'Client-selectable packages' },
  { type: 'add_ons', label: 'Add-ons', icon: '➕', description: 'Optional add-on services' },
  { type: 'roi_value', label: 'ROI / Value', icon: '📈', description: 'Value metrics and ROI stats' },
  { type: 'cta', label: 'Call to Action', icon: '🚀', description: 'Action button section' },
  { type: 'signature', label: 'Signature', icon: '✍️', description: 'E-signature acceptance' },
  { type: 'payment', label: 'Payment', icon: '💳', description: 'Stripe payment integration' },
  { type: 'scheduling', label: 'Scheduling', icon: '📆', description: 'Booking / calendar link' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  signed: 'bg-emerald-100 text-emerald-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-600 text-white',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  proposal: ProposalEngineData;
  proposalId: string;
}

type Panel = 'blocks' | 'meta' | 'packages';

export function ProposalEngineBuilder({ proposal: initialProposal, proposalId }: Props) {
  const [proposal, setProposal] = useState(initialProposal);
  const [activePanel, setActivePanel] = useState<Panel>('blocks');
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [showBlockCatalog, setShowBlockCatalog] = useState(false);
  const [isSending, startSendTransition] = useTransition();
  const [sendState, setSendState] = useState<{ url?: string; error?: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const shareUrl = proposal.shareToken
    ? `${window.location.origin}/proposal/${proposal.shareToken}`
    : null;

  // ── API helpers ──────────────────────────────────────────────────────────────

  const addBlock = useCallback(async (blockType: string) => {
    const res = await fetch(`/api/workspace/proposals-engine/${proposalId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockType }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setProposal((p) => ({ ...p, blocks: [...p.blocks, data.block] }));
    setExpandedBlock(data.block.id);
    setShowBlockCatalog(false);
  }, [proposalId]);

  const updateBlockContent = useCallback(async (blockId: string, content: Record<string, unknown>) => {
    const res = await fetch(`/api/workspace/proposals-engine/${proposalId}/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setProposal((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === blockId ? data.block : b)),
    }));
  }, [proposalId]);

  const deleteBlockById = useCallback(async (blockId: string) => {
    await fetch(`/api/workspace/proposals-engine/${proposalId}/blocks/${blockId}`, { method: 'DELETE' });
    setProposal((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }));
    if (expandedBlock === blockId) setExpandedBlock(null);
  }, [proposalId, expandedBlock]);

  const reorderBlocks = useCallback(async (orderedIds: string[]) => {
    await fetch(`/api/workspace/proposals-engine/${proposalId}/blocks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  }, [proposalId]);

  const updateMeta = useCallback(async (meta: Partial<ProposalEngineData>) => {
    const res = await fetch(`/api/workspace/proposals-engine/${proposalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    if (!res.ok) return;
    const data = await res.json();
    setProposal((p) => ({ ...p, ...data.proposal }));
  }, [proposalId]);

  const handleSend = useCallback(() => {
    startSendTransition(async () => {
      const res = await fetch(`/api/workspace/proposals-engine/${proposalId}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSendState({ error: data.error ?? 'Failed to send' });
      } else {
        setProposal((p) => ({ ...p, status: 'sent', shareToken: data.proposal?.shareToken }));
        setSendState({ url: data.shareUrl });
      }
    });
  }, [proposalId]);

  // ── Drag-and-drop block reorder ───────────────────────────────────────────────

  const handleDragStart = (blockId: string) => setDragItem(blockId);
  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOver(blockId);
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragItem || dragItem === targetId) { setDragOver(null); setDragItem(null); return; }

    const current = [...proposal.blocks].sort((a, b) => a.position - b.position);
    const fromIdx = current.findIndex((b) => b.id === dragItem);
    const toIdx = current.findIndex((b) => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...current];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withPositions = reordered.map((b, i) => ({ ...b, position: i }));
    setProposal((p) => ({ ...p, blocks: withPositions }));
    await reorderBlocks(reordered.map((b) => b.id));
    setDragItem(null);
    setDragOver(null);
  };

  const sortedBlocks = [...proposal.blocks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex min-h-screen gap-0 bg-surface-muted/30">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-white p-4 shadow-sm">
        {/* Status */}
        <div className="mb-4 flex items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[proposal.status] ?? 'bg-muted')}>
            {proposal.status.replace('_', ' ')}
          </span>
        </div>

        {/* Send / Share */}
        {proposal.status === 'draft' || proposal.status === 'sent' ? (
          <TVButton
            className="mb-3 w-full gap-2"
            disabled={isSending}
            size="sm"
            onClick={handleSend}
          >
            <Send size={14} />
            {isSending ? 'Sending…' : proposal.shareToken ? 'Resend' : 'Send Proposal'}
          </TVButton>
        ) : null}

        {shareUrl && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Client link</p>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted p-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{shareUrl}</span>
              <button
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
              >
                <Copy size={12} />
              </button>
              <a className="shrink-0 text-muted-foreground hover:text-foreground" href={shareUrl} rel="noreferrer" target="_blank">
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {sendState?.error && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle size={12} /> {sendState.error}
          </p>
        )}

        <hr className="mb-3 border-border" />

        {/* Panel nav */}
        <nav className="space-y-0.5">
          {([
            { id: 'blocks', label: 'Blocks', Icon: LayoutTemplate },
            { id: 'meta', label: 'Settings', Icon: Settings },
            { id: 'packages', label: 'Packages', Icon: Package },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                activePanel === id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
              )}
              onClick={() => setActivePanel(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <hr className="my-3 border-border" />

        {/* Quick links */}
        <div className="space-y-0.5">
          <a
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            href={shareUrl ?? '#'}
            rel="noreferrer"
            target="_blank"
          >
            <Eye size={15} /> Preview
          </a>
          <a
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            href={`/workspace/proposals/${proposalId}/analytics`}
          >
            <BarChart2 size={15} /> Analytics
          </a>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="mb-1 text-xl font-semibold">{proposal.title}</h1>
        {proposal.clientCompany && (
          <p className="mb-6 text-sm text-muted-foreground">
            {proposal.clientName && `${proposal.clientName} · `}{proposal.clientCompany}
          </p>
        )}

        {/* ── Blocks Panel ─────────────────────────────────────────────── */}
        {activePanel === 'blocks' && (
          <div className="space-y-2">
            {sortedBlocks.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">No blocks yet. Add your first block below.</p>
              </div>
            )}

            {sortedBlocks.map((block, idx) => (
              <div
                key={block.id}
                draggable
                className={cn(
                  'rounded-xl border bg-white transition-all',
                  dragOver === block.id && 'border-primary ring-2 ring-primary/20',
                  !block.isVisible && 'opacity-50',
                )}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragStart={() => handleDragStart(block.id)}
                onDrop={(e) => handleDrop(e, block.id)}
              >
                {/* Block header */}
                <div className="flex items-center gap-3 p-3">
                  <GripVertical className="shrink-0 cursor-grab text-muted-foreground" size={16} />
                  <span className="flex-1 text-sm font-medium capitalize">
                    {block.blockType.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <button
                    className="rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-destructive"
                    onClick={() => deleteBlockById(block.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    className="rounded p-1 text-muted-foreground hover:bg-surface-muted"
                    onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                  >
                    {expandedBlock === block.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Block editor */}
                {expandedBlock === block.id && (
                  <div className="border-t border-border p-4">
                    <ProposalBlockEditor
                      block={block}
                      proposalPackages={proposal.packages}
                      onUpdate={(content) => updateBlockContent(block.id, content)}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Add block */}
            <div className="relative">
              <TVButton
                className="w-full gap-2"
                variant="outline"
                onClick={() => setShowBlockCatalog((v) => !v)}
              >
                <Plus size={15} /> Add Block
              </TVButton>

              {showBlockCatalog && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {BLOCK_CATALOG.map(({ type, label, icon, description }) => (
                      <button
                        key={type}
                        className="flex items-start gap-2 rounded-lg p-2.5 text-left text-sm hover:bg-surface-muted"
                        onClick={() => addBlock(type)}
                      >
                        <span className="shrink-0 text-base">{icon}</span>
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Settings Panel ───────────────────────────────────────────── */}
        {activePanel === 'meta' && (
          <ProposalMetaPanel proposal={proposal} onSave={updateMeta} />
        )}

        {/* ── Packages Panel ───────────────────────────────────────────── */}
        {activePanel === 'packages' && (
          <ProposalPackagesPanel
            packages={proposal.packages}
            proposalId={proposalId}
            onRefresh={async () => {
              const res = await fetch(`/api/workspace/proposals-engine/${proposalId}`);
              const data = await res.json();
              setProposal((p) => ({ ...p, packages: data.proposal?.packages ?? p.packages }));
            }}
          />
        )}
      </main>
    </div>
  );
}
