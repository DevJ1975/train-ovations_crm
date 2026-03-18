'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart2,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  FileText,
  Globe,
  Mail,
  PieChart,
  Radar,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';

type CommandItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  icon: typeof Search;
  keywords: string[];
};

const COMMANDS: CommandItem[] = [
  { id: 'workspace', label: 'Workspace', detail: 'Rep command center', href: '/workspace', icon: Sparkles, keywords: ['home', 'dashboard', 'overview'] },
  { id: 'tasks', label: 'Task Center', detail: 'Generated follow-up and next steps', href: '/workspace/tasks', icon: Sparkles, keywords: ['tasks', 'follow-up', 'queue'] },
  { id: 'leads', label: 'Lead Queue', detail: 'Assigned contacts and lead inbox', href: '/workspace/leads', icon: Users, keywords: ['leads', 'contacts', 'inbox'] },
  { id: 'accounts', label: 'Accounts', detail: 'Company accounts and pipeline', href: '/workspace/accounts', icon: Building2, keywords: ['accounts', 'companies'] },
  { id: 'opportunities', label: 'Pipeline', detail: 'Open deals by stage', href: '/workspace/opportunities', icon: PieChart, keywords: ['pipeline', 'deals', 'opportunities'] },
  { id: 'inbox', label: 'Connected Inbox', detail: 'Linked email threads', href: '/workspace/inbox', icon: Mail, keywords: ['email', 'inbox', 'messages'] },
  { id: 'calendar', label: 'Calendar', detail: 'Events and scheduled follow-up', href: '/workspace/calendar', icon: CalendarClock, keywords: ['calendar', 'events', 'schedule'] },
  { id: 'alerts', label: 'Alert Queue', detail: 'Relationship and movement signals', href: '/workspace/alerts', icon: BellRing, keywords: ['alerts', 'signals', 'notifications'] },
  { id: 'notes', label: 'Notes', detail: 'Meeting notes, briefs, follow-up plans', href: '/workspace/notes', icon: BookOpen, keywords: ['notes', 'meeting', 'brief'] },
  { id: 'journal', label: 'Rep Journal', detail: 'Private field notes', href: '/workspace/journal', icon: FileText, keywords: ['journal', 'notes', 'private'] },
  { id: 'proposals', label: 'Proposals', detail: 'AI-powered proposal generator', href: '/workspace/proposals', icon: FileText, keywords: ['proposals', 'sow', 'contract'] },
  { id: 'reports', label: 'Reports & Analytics', detail: 'Pipeline and funnel performance', href: '/workspace/reports', icon: BarChart2, keywords: ['reports', 'analytics', 'performance'] },
  { id: 'profile', label: 'My Profile', detail: 'Edit name, title, bio, contact info', href: '/workspace/profile', icon: User, keywords: ['profile', 'settings', 'bio'] },
  { id: 'public-page', label: 'Public Page', detail: 'Rep landing page preview', href: '/rep', icon: Globe, keywords: ['public', 'landing', 'page', 'qr'] },
  { id: 'integrations', label: 'Integrations', detail: 'Google, Zoom, Notion connections', href: '/settings/integrations', icon: Radar, keywords: ['integrations', 'google', 'zoom', 'notion'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? COMMANDS.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.detail.toLowerCase().includes(q) ||
          c.keywords.some((k) => k.includes(q))
        );
      })
    : COMMANDS;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(filtered[selected].href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search pages and tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
            <button
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[340px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected
                      ? 'bg-primary/8 text-foreground'
                      : 'text-foreground hover:bg-surface-muted/60'
                  }`}
                  type="button"
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${i === selected ? 'border-primary/30 bg-primary/10' : 'border-border/60 bg-surface-muted/60'}`}>
                    <Icon className={`h-4 w-4 ${i === selected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  {i === selected ? (
                    <kbd className="ml-auto shrink-0 rounded border border-border/60 bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      ↵
                    </kbd>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border/60 bg-surface-muted px-1 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border border-border/60 bg-surface-muted px-1 font-mono text-[10px]">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border/60 bg-surface-muted px-1 font-mono text-[10px]">↵</kbd>
            open
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border/60 bg-surface-muted px-1 font-mono text-[10px]">⌘K</kbd>
            toggle
          </span>
        </div>
      </div>
    </div>
  );
}
