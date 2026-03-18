'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Chrome } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';

import { TVButton, TVCard, TVInput } from '@/components/trainovations';
import {
  credentialsSchema,
  getDefaultAuthenticatedRoute,
  type CredentialsInput,
} from '@/lib/auth';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleSignInEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED);
  const callbackUrl = searchParams.get('callbackUrl') ?? getDefaultAuthenticatedRoute();

  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: CredentialsInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!response || response.error) {
      setErrorMessage('Invalid email or password.');
      return;
    }

    window.location.href = response.url ?? callbackUrl;
  }

  async function handleGoogleSignIn() {
    await signIn('google', {
      callbackUrl,
    });
  }

  return (
    <TVCard className="w-full max-w-md space-y-6 p-8">
      <div className="space-y-2">
        <p className="text-label uppercase tracking-[0.2em] text-primary">
          Trainovations CRM
        </p>
        <h1 className="text-section text-foreground">Sign in to CRM</h1>
        <p className="text-body text-muted-foreground">
          Use one of the seeded MVP accounts to access your Trainovations workspace.
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-label text-foreground" htmlFor="email">
            Email
          </label>
          <TVInput
            id="email"
            type="email"
            autoComplete="email"
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-danger">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-label text-foreground" htmlFor="password">
            Password
          </label>
          <TVInput
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-danger">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

        <TVButton className="w-full" size="lg" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </TVButton>
      </form>

      {googleSignInEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <TVButton
            className="w-full"
            onClick={handleGoogleSignIn}
            type="button"
            variant="secondary"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </TVButton>
        </div>
      ) : null}

      <div className="rounded-lg border bg-surface-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Seed credentials</p>
        <p>
          <code>admin@trainovations.com</code> /{' '}
          <code>Trainovations123!</code>
        </p>
        <p className="mt-2">
          <code>jay.jones@trainovations.com</code> /{' '}
          <code>Trainovations123!</code>
        </p>
      </div>

      <Link className="text-sm text-primary hover:underline" href="/">
        Return to overview
      </Link>
    </TVCard>
  );
}
