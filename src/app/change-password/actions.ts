'use server';

import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { hashPassword } from '@/lib/auth/password';
import { changePasswordSchema } from '@/lib/auth/schema';
import { getPrismaClient } from '@/lib/prisma';

export async function changePasswordAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/change-password');
  const parsed = changePasswordSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid password');
  }

  const prisma = getPrismaClient();
  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
      mustChangePassword: false,
      invitationAcceptedAt: new Date(),
    },
  });

  redirect('/workspace');
}
