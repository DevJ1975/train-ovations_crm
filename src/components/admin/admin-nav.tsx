'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BriefcaseBusiness, Building2, Shield, Trophy, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

const adminNavigation = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/accounts', label: 'Accounts', icon: Building2 },
  { href: '/admin/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { href: '/admin/reps', label: 'Reps', icon: Shield },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 space-y-1">
      {adminNavigation.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-label transition-colors',
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
            )}
            href={href}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-current')} />
            <span>{label}</span>
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
