/**
 * Proposal Hook Service
 * Fires webhook events when proposal lifecycle events occur.
 * Structured for future automation integrations (Zapier, n8n, native sequences).
 */

import { getPrismaClient } from '@/lib/prisma';

export type ProposalHookEvent =
  | 'proposal.created'
  | 'proposal.sent'
  | 'proposal.viewed'
  | 'proposal.accepted'
  | 'proposal.signed'
  | 'proposal.payment_received'
  | 'proposal.declined'
  | 'proposal.expired';

export interface ProposalHookPayload {
  proposalId: string;
  repProfileId: string;
  [key: string]: unknown;
}

/**
 * Fire registered webhook endpoints for a proposal event.
 * Non-blocking — errors are caught and logged, not re-thrown.
 */
export async function fireProposalHooks(
  event: ProposalHookEvent,
  payload: ProposalHookPayload,
  db = getPrismaClient(),
) {
  try {
    // Find webhooks registered for this event by this rep's user
    const repProfile = await db.repProfile.findUnique({
      where: { id: payload.repProfileId },
      select: { userId: true },
    });
    if (!repProfile) return;

    const endpoints = await db.webhookEndpoint.findMany({
      where: {
        userId: repProfile.userId,
        isActive: true,
        events: { has: event },
      },
      select: { id: true, url: true, secret: true },
    });

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const { createHmac } = await import('crypto');
        const sig = createHmac('sha256', endpoint.secret).update(body).digest('hex');
        await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Signature': `sha256=${sig}`,
          },
          body,
          signal: AbortSignal.timeout(10000),
        });
      }),
    );
  } catch {
    // Swallow — hooks must never break the main flow
  }
}

/**
 * Check and mark expired proposals (for scheduled job use).
 */
export async function expireOverdueProposals(db = getPrismaClient()) {
  const now = new Date();
  const expired = await db.proposal.findMany({
    where: { status: { in: ['draft', 'sent', 'viewed'] }, expiresAt: { lt: now } },
    select: { id: true, repProfileId: true },
  });

  for (const p of expired) {
    await db.proposal.update({ where: { id: p.id }, data: { status: 'expired' } });
    await fireProposalHooks('proposal.expired', { proposalId: p.id, repProfileId: p.repProfileId });
  }

  return expired.length;
}
