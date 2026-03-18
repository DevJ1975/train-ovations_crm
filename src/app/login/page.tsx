import { redirect } from 'next/navigation';

import { auth } from '../../../auth';
import { LoginForm } from '@/components/auth/login-form';
import { getDefaultAuthenticatedRoute } from '@/lib/auth';

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const callbackUrl =
    resolvedSearchParams?.callbackUrl ??
    getDefaultAuthenticatedRoute(session?.user?.role);

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="tv-shell flex min-h-screen items-center justify-center px-6 py-16">
      <LoginForm />
    </main>
  );
}
