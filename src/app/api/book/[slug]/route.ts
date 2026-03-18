import { NextResponse } from 'next/server';
import { LeadStatus, SourceType } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = getPrismaClient();

  const rep = await db.repProfile.findUnique({
    where: { slug },
    select: { id: true, bookingEnabled: true, bookingDuration: true },
  });
  if (!rep || !rep.bookingEnabled) {
    return NextResponse.json({ error: 'Booking not available' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { guestName, guestEmail, guestPhone, guestNotes, requestedAt } = body as Record<string, string>;
  if (!guestName || !guestEmail || !requestedAt) {
    return NextResponse.json({ error: 'guestName, guestEmail, and requestedAt are required' }, { status: 400 });
  }

  const [firstName, ...rest] = String(guestName).trim().split(' ');
  const lastName = rest.join(' ') || '—';

  // Create a lead and a booking record in parallel
  await Promise.all([
    db.lead.create({
      data: {
        firstName,
        lastName,
        email: String(guestEmail),
        phone: guestPhone ? String(guestPhone) : null,
        notes: guestNotes ? String(guestNotes) : null,
        status: LeadStatus.new,
        sourceType: SourceType.landing_page,
        repProfileId: rep.id,
        consent: true,
      },
    }),
    db.booking.create({
      data: {
        repProfileId: rep.id,
        guestName: String(guestName),
        guestEmail: String(guestEmail),
        guestPhone: guestPhone ? String(guestPhone) : null,
        guestNotes: guestNotes ? String(guestNotes) : null,
        requestedAt: new Date(requestedAt),
        durationMins: rep.bookingDuration,
      },
    }),
  ]);

  return NextResponse.json({ success: true, message: 'Booking request received' });
}
