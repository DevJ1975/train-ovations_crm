import { NextResponse } from 'next/server';

import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';
import { buildVCardFromRepProfile, getVCardFilename } from '@/lib/public/vcard';

interface RouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { slug } = await params;
  const data = await getPublicRepLandingPageData(slug);

  if (!data) {
    return NextResponse.json({ message: 'Rep not found.' }, { status: 404 });
  }

  const vCard = buildVCardFromRepProfile(data);

  return new NextResponse(vCard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${getVCardFilename(slug)}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
