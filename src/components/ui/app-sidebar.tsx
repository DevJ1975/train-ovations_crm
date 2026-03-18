'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  CalendarDays,
  Bell,
  GitMerge,
  Users,
  Building2,
  TrendingUp,
  FileText,
  BookOpen,
  NotebookPen,
  BarChart2,
  Target,
  User,
  Plug,
  Webhook,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/workspace', exact: true },
    ],
  },
  {
    label: 'Activity',
    items: [
      { icon: Inbox,        label: 'Inbox',     href: '/workspace/inbox' },
      { icon: CheckSquare,  label: 'Tasks',     href: '/workspace/tasks' },
      { icon: CalendarDays, label: 'Calendar',  href: '/workspace/calendar' },
      { icon: Bell,         label: 'Alerts',    href: '/workspace/alerts' },
      { icon: GitMerge,     label: 'Sequences', href: '/workspace/sequences' },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { icon: Users,       label: 'Leads',         href: '/workspace/leads' },
      { icon: Building2,   label: 'Accounts',      href: '/workspace/accounts' },
      { icon: TrendingUp,  label: 'Opportunities', href: '/workspace/opportunities' },
      { icon: FileText,    label: 'Proposals',     href: '/workspace/proposals' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { icon: BookOpen,    label: 'Notes',   href: '/workspace/notes' },
      { icon: NotebookPen, label: 'Journal', href: '/workspace/journal' },
      { icon: BarChart2,   label: 'Reports', href: '/workspace/reports' },
      { icon: Target,      label: 'Quota',   href: '/workspace/quota' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { icon: User,       label: 'Profile',      href: '/workspace/profile' },
      { icon: Plug,       label: 'Integrations', href: '/settings/integrations' },
      { icon: Webhook,    label: 'Webhooks',     href: '/workspace/webhooks' },
      { icon: ShieldCheck,label: 'Admin',        href: '/admin' },
    ],
  },
];

// Paths where the sidebar should not appear
const HIDE_ON_PREFIXES = ['/login', '/rep/', '/proposal/', '/book/'];

function isRouteActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hidden =
    pathname === '/' ||
    HIDE_ON_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hidden) return;

    const OPEN_THRESHOLD = 60;   // px from left edge to trigger open
    const CLOSE_THRESHOLD = 280; // px from left edge to trigger close

    function handleMouseMove(e: MouseEvent) {
      if (e.clientX < OPEN_THRESHOLD) {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setIsOpen(true);
      } else if (e.clientX > CLOSE_THRESHOLD) {
        if (!closeTimerRef.current) {
          closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
            closeTimerRef.current = null;
          }, 200);
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <>
      {/* Thin indicator strip — always visible as affordance */}
      <div
        className="fixed left-0 top-0 h-full w-0.5 z-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.6) 40%, rgba(99,102,241,0.6) 60%, transparent 100%)' }}
      />

      {/* Backdrop — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-full w-[248px] z-50 flex flex-col',
          'bg-zinc-950 border-r border-zinc-800/60',
          'shadow-[4px_0_32px_rgba(0,0,0,0.5)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-4 py-[18px] border-b border-zinc-800/80">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-white">
            T
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight text-white">Trainovations</p>
            <p className="text-[10px] leading-tight text-zinc-500">CRM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-0.5">
              <p className="px-4 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = isRouteActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                      active
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0 transition-colors',
                        active ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300',
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-4 py-3">
          <p className="text-[10px] text-zinc-600">
            Press <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-[9px] text-zinc-400">⌘K</kbd> for quick search
          </p>
        </div>
      </div>
    </>
  );
}
