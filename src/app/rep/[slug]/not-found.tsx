import Link from 'next/link';

import {
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';

export default function RepLandingNotFound() {
  return (
    <main className="tv-shell flex min-h-screen items-center justify-center px-6 py-16">
      <TVCard className="max-w-xl space-y-4">
        <TVCardTitle>Rep page not found</TVCardTitle>
        <TVCardDescription>
          This Trainovations contact page is unavailable or the QR/NFC link is no
          longer active.
        </TVCardDescription>
        <TVButton asChild>
          <Link href="/">Return to Trainovations</Link>
        </TVButton>
      </TVCard>
    </main>
  );
}
