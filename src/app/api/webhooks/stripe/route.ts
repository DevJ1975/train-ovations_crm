import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { handleStripeWebhook } from '@/lib/services/proposal-payment-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headerMap = await headers();
  const signature = headerMap.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  try {
    await handleStripeWebhook(rawBody, signature);
    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Webhook error';
    console.error('[Stripe webhook]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
