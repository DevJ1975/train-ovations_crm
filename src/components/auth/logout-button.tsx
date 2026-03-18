'use client';

import { signOut } from 'next-auth/react';

import { TVButton } from '@/components/trainovations';

export function LogoutButton() {
  return (
    <TVButton type="button" variant="secondary" onClick={() => signOut({ callbackUrl: '/login' })}>
      Sign out
    </TVButton>
  );
}
