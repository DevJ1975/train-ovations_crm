'use server';

import { revalidatePath } from 'next/cache';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';
import { updateRepProfile } from '@/lib/services';

export async function updateRepProfileAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/profile');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) throw new Error('Rep profile not found');

  await updateRepProfile(repProfile.id, {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    displayName: String(formData.get('displayName') ?? ''),
    title: String(formData.get('title') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    website: String(formData.get('website') ?? ''),
    location: String(formData.get('location') ?? ''),
  });

  revalidatePath('/workspace');
  revalidatePath('/workspace/profile');
}
