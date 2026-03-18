'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/auth/server';
import { sendRepInviteEmail } from '@/lib/email/rep-invite-email-service';
import {
  inviteRepUser,
  offboardRepUser,
  resendRepInvite,
  updateRepProfileBasic,
} from '@/lib/services';

export async function updateRepProfileBasicAction(formData: FormData) {
  const user = await requireAdminUser('/admin/reps');

  const repProfileId = String(formData.get('repProfileId') ?? '');

  await updateRepProfileBasic(user, repProfileId, {
    displayName: String(formData.get('displayName') ?? ''),
    title: String(formData.get('title') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    website: String(formData.get('website') ?? ''),
    location: String(formData.get('location') ?? ''),
    isActive: formData.get('isActive') === 'true',
  });

  revalidatePath('/admin/reps');
}

export async function inviteRepUserAction(formData: FormData) {
  const user = await requireAdminUser('/admin/reps');

  const result = await inviteRepUser(user, {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    email: String(formData.get('email') ?? ''),
    title: String(formData.get('title') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    website: String(formData.get('website') ?? ''),
    location: String(formData.get('location') ?? ''),
  });

  await sendRepInviteEmail({
    to: result.user.email,
    adminName: user.name ?? '',
    repName: result.repProfile.displayName,
    temporaryPassword: result.temporaryPassword,
  });

  revalidatePath('/admin/reps');
}

export async function resendRepInviteAction(formData: FormData) {
  const user = await requireAdminUser('/admin/reps');
  const repProfileId = String(formData.get('repProfileId') ?? '');

  const result = await resendRepInvite(user, repProfileId);

  await sendRepInviteEmail({
    to: result.user.email,
    adminName: user.name ?? '',
    repName: result.repProfile.displayName,
    temporaryPassword: result.temporaryPassword,
  });

  revalidatePath('/admin/reps');
}

export async function offboardRepUserAction(formData: FormData) {
  const user = await requireAdminUser('/admin/reps');

  await offboardRepUser(
    user,
    String(formData.get('repProfileId') ?? ''),
    String(formData.get('reassignmentRepProfileId') ?? ''),
  );

  revalidatePath('/admin/reps');
  revalidatePath('/admin/leads');
  revalidatePath('/admin/accounts');
  revalidatePath('/admin/opportunities');
}
