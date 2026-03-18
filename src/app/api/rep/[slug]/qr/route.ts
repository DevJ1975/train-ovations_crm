import { NextResponse } from 'next/server';

import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';
import { QrCodeService } from '@/lib/qr/qr-code-service';

interface RouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const data = await getPublicRepLandingPageData(slug);

  if (!data) {
    return NextResponse.json({ message: 'Rep not found.' }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const landingPageUrl = new URL(data.rep.slug ? `/rep/${data.slug}` : '/', requestUrl.origin);
  const svg = await QrCodeService.toSvgString(landingPageUrl.toString());

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `inline; filename="${data.slug}-qr.svg"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
