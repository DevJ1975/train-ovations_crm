import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { WebhookSettings } from '@/components/workspace/webhook-settings';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  const user = await requireAuthenticatedUser('/workspace/webhooks');

  const db = getPrismaClient();

  const webhooks = await db.webhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Webhook Settings' }]} />
          <TVSectionHeader
            description="Register external endpoints to receive real-time event notifications from Trainovations CRM."
            eyebrow="Settings"
            title="Webhook Settings"
          />
        </div>

        <WebhookSettings webhooks={webhooks} />
      </div>
    </main>
  );
}
