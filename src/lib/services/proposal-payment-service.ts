/**
 * Proposal Payment Service
 * Stripe integration for proposal payments.
 * Supports full payment and deposit (partial) payments.
 */

import { getPrismaClient } from '@/lib/prisma';
import { fireProposalHooks } from './proposal-hook-service';

type DB = ReturnType<typeof getPrismaClient>;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  // Dynamic import so Stripe is tree-shaken when not used
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export interface CreateCheckoutOptions {
  token: string;
  selectedPackageId?: string;
  selectedAddOnIds?: string[];
  successUrl: string;
  cancelUrl: string;
}

export async function createProposalCheckoutSession(
  options: CreateCheckoutOptions,
  db: DB = getPrismaClient(),
) {
  const stripe = getStripe();

  const proposal = await db.proposal.findUnique({
    where: { shareToken: options.token },
    select: {
      id: true,
      title: true,
      totalValueCents: true,
      paymentType: true,
      depositPercent: true,
      clientEmail: true,
      repProfileId: true,
      packages: {
        where: { id: options.selectedPackageId ?? '' },
        include: { addOns: { where: { id: { in: options.selectedAddOnIds ?? [] } } } },
      },
    },
  });
  if (!proposal) throw new Error('Proposal not found');

  // Build line items
  const lineItems: { price_data: object; quantity: number }[] = [];
  let baseAmount = 0;

  if (options.selectedPackageId && proposal.packages.length > 0) {
    const pkg = proposal.packages[0];
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: pkg.name, description: pkg.description ?? undefined },
        unit_amount: pkg.priceCents,
      },
      quantity: 1,
    });
    baseAmount += pkg.priceCents;

    for (const addon of pkg.addOns) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: addon.name, description: addon.description ?? undefined },
          unit_amount: addon.priceCents,
        },
        quantity: 1,
      });
      baseAmount += addon.priceCents;
    }
  } else if (proposal.totalValueCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: proposal.title },
        unit_amount: proposal.paymentType === 'deposit' && proposal.depositPercent
          ? Math.round(proposal.totalValueCents * (proposal.depositPercent / 100))
          : proposal.totalValueCents,
      },
      quantity: 1,
    });
    baseAmount = proposal.totalValueCents;
  }

  if (lineItems.length === 0) throw new Error('No payable items found');

  // Apply deposit if applicable
  if (proposal.paymentType === 'deposit' && proposal.depositPercent && !options.selectedPackageId) {
    const depositAmount = Math.round(baseAmount * (proposal.depositPercent / 100));
    lineItems[0] = {
      ...lineItems[0],
      price_data: {
        ...(lineItems[0].price_data as object),
        unit_amount: depositAmount,
      },
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: proposal.clientEmail ?? undefined,
    line_items: lineItems,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      proposalId: proposal.id,
      proposalToken: options.token,
      selectedPackageId: options.selectedPackageId ?? '',
      selectedAddOnIds: (options.selectedAddOnIds ?? []).join(','),
    },
  });

  // Record session
  await db.proposal.update({
    where: { id: proposal.id },
    data: { stripeSessionId: session.id },
  });

  await db.proposalPayment.create({
    data: {
      proposalId: proposal.id,
      stripeSessionId: session.id,
      amountCents: lineItems.reduce((sum, li) => sum + (li.price_data as { unit_amount: number }).unit_amount, 0),
      currency: 'usd',
      status: 'pending',
    },
  });

  return { sessionId: session.id, url: session.url };
}

export async function handleStripeWebhook(rawBody: string, signature: string, db: DB = getPrismaClient()) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      payment_intent: string;
      metadata: { proposalId?: string };
      amount_total: number;
    };

    const proposalId = session.metadata?.proposalId;
    if (!proposalId) return;

    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true, repProfileId: true, paymentType: true, totalValueCents: true },
    });
    if (!proposal) return;

    const isDeposit = proposal.paymentType === 'deposit';
    const newStatus = isDeposit ? 'partially_paid' : 'paid';
    const now = new Date();

    await db.proposal.update({
      where: { id: proposalId },
      data: {
        status: newStatus,
        stripePaymentIntentId: session.payment_intent,
        ...(isDeposit ? { partiallyPaidAt: now } : { paidAt: now }),
      },
    });

    await db.proposalPayment.update({
      where: { stripeSessionId: session.id },
      data: {
        stripePaymentIntentId: session.payment_intent,
        amountCents: session.amount_total,
        status: 'paid',
        paidAt: now,
      },
    });

    await db.proposalAnalyticsEvent.create({
      data: { proposalId, eventType: 'payment_completed', metadata: { stripeSessionId: session.id } },
    });

    await fireProposalHooks('proposal.payment_received', {
      proposalId,
      repProfileId: proposal.repProfileId,
      amountCents: session.amount_total,
      isDeposit,
    });
  }
}
