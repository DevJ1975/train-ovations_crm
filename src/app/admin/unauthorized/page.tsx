import Link from 'next/link';

import { TVButton, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';

export default function UnauthorizedPage() {
  return (
    <main className="tv-shell flex min-h-screen items-center justify-center px-6 py-16">
      <TVCard className="max-w-lg space-y-4">
        <TVCardTitle>Access restricted</TVCardTitle>
        <TVCardDescription>
          Your account is authenticated but does not currently have admin access.
        </TVCardDescription>
        <TVButton asChild>
          <Link href="/login">Return to login</Link>
        </TVButton>
      </TVCard>
    </main>
  );
}
