import { redirect } from 'next/navigation';

import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { requireAuthenticatedUser } from '@/lib/auth/server';

import { changePasswordAction } from './actions';

export default async function ChangePasswordPage() {
  const user = await requireAuthenticatedUser('/change-password');

  if (!user.mustChangePassword) {
    redirect('/workspace');
  }

  return (
    <main className="tv-shell flex min-h-screen items-center justify-center px-6 py-10">
      <ChangePasswordForm action={changePasswordAction} />
    </main>
  );
}
