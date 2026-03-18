import { TVSectionHeader } from '@/components/trainovations';
import { IntegrationSettingsClient } from '@/components/settings/integration-settings-client';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { canAccessIntegrationSettings } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

export default async function IntegrationSettingsPage() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  if (!canAccessIntegrationSettings(user.role)) {
    return null;
  }

  return (
    <main className="tv-shell min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <TVSectionHeader
          eyebrow="Integrations"
          title="Connected work tools"
          description="Connect Google, Zoom, and Notion so Trainovations CRM can support future meeting automation and AI-ready note workflows without changing the CRM as the source of truth."
        />
        <IntegrationSettingsClient userId={user.id} />
      </section>
    </main>
  );
}
