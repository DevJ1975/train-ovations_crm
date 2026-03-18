import { notFound } from 'next/navigation';
import { BookingPageClient } from '@/components/public/booking-page-client';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getPrismaClient();

  const rep = await db.repProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      displayName: true,
      title: true,
      photoUrl: true,
      bookingEnabled: true,
      bookingTitle: true,
      bookingDuration: true,
    },
  });

  if (!rep || !rep.bookingEnabled) notFound();

  return (
    <BookingPageClient
      slug={slug}
      repName={rep.displayName}
      repTitle={rep.title}
      bookingTitle={rep.bookingTitle ?? `Book a ${rep.bookingDuration}-min call with ${rep.displayName}`}
      bookingDuration={rep.bookingDuration}
      photoUrl={rep.photoUrl}
    />
  );
}
