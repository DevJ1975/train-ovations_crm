'use server';

import { ConnectedProvider } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { disconnectConnectedAccount } from '@/lib/integrations';
import { getPrismaClient } from '@/lib/prisma';

export async function disconnectIntegrationAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const provider = String(formData.get('provider') ?? '') as ConnectedProvider;

  await disconnectConnectedAccount(user.id, provider);
  revalidatePath('/settings/integrations');
}

export async function updateIntegrationPreferencesAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const provider = String(formData.get('provider') ?? '') as ConnectedProvider;
  const prisma = getPrismaClient();

  await prisma.connectedAccount.update({
    where: {
      userId_provider: {
        userId: user.id,
        provider,
      },
    },
    data: {
      syncEnabled: formData.get('syncEnabled') === 'true',
      automationEnabled: formData.get('automationEnabled') === 'true',
    },
  });

  revalidatePath('/settings/integrations');
}
