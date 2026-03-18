import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { ObservabilityService } from '@/lib/observability/observability-service';
import { BusinessCardParsingService } from '@/lib/ocr/business-card-parsing-service';

export async function POST(request: Request) {
  await requireAuthenticatedUser('/workspace');

  const formData = await request.formData();
  const image = formData.get('image');

  if (!(image instanceof Blob)) {
    return NextResponse.json(
      {
        message: 'Business card image is required.',
      },
      { status: 400 },
    );
  }

  try {
    const parsedCard = await BusinessCardParsingService.parseCard(image);

    return NextResponse.json({
      parsedCard,
    });
  } catch (error) {
    ObservabilityService.captureIntegrationError('ocr', error, {
      route: '/api/workspace/business-card/parse',
    });

    return NextResponse.json(
      {
        message: 'Unable to process business card right now.',
      },
      { status: 500 },
    );
  }
}
