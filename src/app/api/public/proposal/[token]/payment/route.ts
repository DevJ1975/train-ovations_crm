import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createProposalCheckoutSession } from '@/lib/services/proposal-payment-service';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ token: string }> };

const schema = z.object({
  selectedPackageId: z.string().cuid().optional(),
  selectedAddOnIds: z.array(z.string().cuid()).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const result = await createProposalCheckoutSession({
      token,
      selectedPackageId: parsed.data.selectedPackageId,
      selectedAddOnIds: parsed.data.selectedAddOnIds,
      successUrl: `${appUrl}/proposal/${token}?payment=success`,
      cancelUrl: `${appUrl}/proposal/${token}?payment=cancelled`,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
