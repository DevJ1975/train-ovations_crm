import { redirect } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { RepProfileEditor } from '@/components/workspace/rep-profile-editor';
import { BookingSettings } from '@/components/workspace/booking-settings';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

import { updateRepProfileAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function RepProfilePage() {
  const user = await requireAuthenticatedUser('/workspace/profile');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      title: true,
      bio: true,
      email: true,
      phone: true,
      website: true,
      location: true,
      photoUrl: true,
      slug: true,
      bookingEnabled: true,
      bookingTitle: true,
      bookingDuration: true,
    },
  });

  if (!repProfile) redirect('/workspace');

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <TVSectionHeader
          description="Update your public profile, contact info, and the photo shown on your landing page."
          eyebrow="My Profile"
          title="Edit profile"
        />
        <RepProfileEditor profile={repProfile} updateAction={updateRepProfileAction} />
        <BookingSettings
          slug={repProfile.slug}
          initialEnabled={repProfile.bookingEnabled}
          initialTitle={repProfile.bookingTitle}
          initialDuration={repProfile.bookingDuration}
        />
      </div>
    </main>
  );
}
