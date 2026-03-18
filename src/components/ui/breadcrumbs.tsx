import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        href="/workspace"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Workspace</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-border" />
          {crumb.href ? (
            <Link
              className="transition-colors hover:text-foreground"
              href={crumb.href}
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
