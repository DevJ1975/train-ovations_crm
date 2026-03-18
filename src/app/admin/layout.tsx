import type { ReactNode } from 'react';

import { TVBadge } from '@/components/trainovations';
import { AdminNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/auth/logout-button';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { WeatherWidget } from '@/components/ui/weather-widget';
import { requireAdminUser } from '@/lib/auth/server';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireAdminUser('/admin');

  return (
    <div className="tv-shell min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r bg-surface px-6 py-8">
          <WeatherWidget />
          <div className="space-y-3">
            <p className="text-label uppercase tracking-[0.2em] text-primary">
              Trainovations
            </p>
            <h1 className="text-card text-foreground">CRM Admin</h1>
            <TVBadge>{user.role.replace('_', ' ')}</TVBadge>
          </div>

          <AdminNav />
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b bg-surface px-6 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-label text-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
