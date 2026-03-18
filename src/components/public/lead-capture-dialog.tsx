'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  TVButton,
  TVCheckbox,
  TVDialog,
  TVDialogContent,
  TVDialogDescription,
  TVDialogHeader,
  TVDialogTitle,
  TVInput,
  TVTextarea,
} from '@/components/trainovations';
import {
  createPublicLeadSubmissionSchema,
  type CreatePublicLeadSubmissionInput,
} from '@/lib/validation/crm';

interface LeadCaptureDialogProps {
  landingPageId: string;
  repSlug: string;
  repFirstName: string;
  endpoint: string;
  triggerLabel: string;
}

function errorMessage(
  error: string[] | { message?: string } | undefined,
): string | undefined {
  if (!error) {
    return undefined;
  }

  if (Array.isArray(error)) {
    return error[0];
  }

  return error.message;
}

export function LeadCaptureDialog({
  landingPageId,
  repSlug,
  repFirstName,
  endpoint,
  triggerLabel,
}: LeadCaptureDialogProps) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<
    { status: 'idle' } | { status: 'success'; message: string } | { status: 'error'; message: string }
  >({ status: 'idle' });

  const queryParams = useMemo(
    () => Object.fromEntries(searchParams?.entries() ?? []),
    [searchParams],
  );

  const form = useForm<CreatePublicLeadSubmissionInput>({
    resolver: zodResolver(createPublicLeadSubmissionSchema),
    defaultValues: {
      landingPageId,
      repSlug,
      submittedAt: new Date().toISOString(),
      firstName: '',
      lastName: '',
      company: '',
      jobTitle: '',
      email: '',
      phone: '',
      industry: '',
      interest: '',
      notes: '',
      consent: false as never,
      queryParams,
      companyEmailWebsite: '',
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    form.setValue('queryParams', queryParams);
  }, [form, queryParams]);

  async function onSubmit(values: CreatePublicLeadSubmissionInput) {
    setIsSubmitting(true);
    setSubmissionState({ status: 'idle' });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...values,
        submittedAt: new Date().toISOString(),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; fieldErrors?: Record<string, string[]> }
        | null;

      if (payload?.fieldErrors) {
        for (const [field, errors] of Object.entries(payload.fieldErrors)) {
          if (errors?.length) {
            form.setError(field as keyof CreatePublicLeadSubmissionInput, {
              type: 'server',
              message: errors[0],
            });
          }
        }
      }

      setSubmissionState({
        status: 'error',
        message:
          payload?.message ??
          'We could not submit your request right now. Please try again.',
      });
      return;
    }

    form.reset({
      landingPageId,
      repSlug,
      submittedAt: new Date().toISOString(),
      firstName: '',
      lastName: '',
      company: '',
      jobTitle: '',
      email: '',
      phone: '',
      industry: '',
      interest: '',
      notes: '',
      consent: false as never,
      queryParams,
      companyEmailWebsite: '',
    });

    setSubmissionState({
      status: 'success',
      message: `${repFirstName} has your details. Someone will follow up soon.`,
    });
  }

  return (
    <TVDialog open={open} onOpenChange={setOpen}>
      <TVButton size="lg" className="w-full" onClick={() => setOpen(true)}>
        {triggerLabel}
      </TVButton>
      <TVDialogContent className="max-h-[90vh] overflow-y-auto">
        <TVDialogHeader>
          <TVDialogTitle>Request information</TVDialogTitle>
          <TVDialogDescription>
            Share your details and {repFirstName} can follow up with the right
            Trainovations context for your team.
          </TVDialogDescription>
        </TVDialogHeader>

        {submissionState.status === 'success' ? (
          <div className="space-y-4">
            <p className="rounded-lg border bg-surface-muted p-4 text-sm text-foreground">
              {submissionState.message}
            </p>
            <TVButton className="w-full" onClick={() => setOpen(false)}>
              Close
            </TVButton>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <input type="hidden" {...form.register('landingPageId')} />
            <input type="hidden" {...form.register('repSlug')} />
            <input type="hidden" {...form.register('submittedAt')} />
            <input
              aria-hidden="true"
              autoComplete="off"
              className="hidden"
              tabIndex={-1}
              {...form.register('companyEmailWebsite')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="firstName">
                  First name
                </label>
                <TVInput id="firstName" {...form.register('firstName')} />
                {form.formState.errors.firstName ? (
                  <p className="text-sm text-danger">
                    {errorMessage(form.formState.errors.firstName)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="lastName">
                  Last name
                </label>
                <TVInput id="lastName" {...form.register('lastName')} />
                {form.formState.errors.lastName ? (
                  <p className="text-sm text-danger">
                    {errorMessage(form.formState.errors.lastName)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="company">
                  Company
                </label>
                <TVInput id="company" {...form.register('company')} />
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="jobTitle">
                  Job title
                </label>
                <TVInput id="jobTitle" {...form.register('jobTitle')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="email">
                  Email
                </label>
                <TVInput id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email ? (
                  <p className="text-sm text-danger">
                    {errorMessage(form.formState.errors.email)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="phone">
                  Phone
                </label>
                <TVInput id="phone" type="tel" {...form.register('phone')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="industry">
                  Industry
                </label>
                <TVInput id="industry" {...form.register('industry')} />
              </div>
              <div className="space-y-2">
                <label className="text-label text-foreground" htmlFor="interest">
                  Interest
                </label>
                <TVInput id="interest" {...form.register('interest')} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="notes">
                Notes
              </label>
              <TVTextarea id="notes" {...form.register('notes')} />
            </div>

            <label className="flex items-start gap-3 rounded-lg border bg-surface-muted p-4 text-sm text-muted-foreground">
              <TVCheckbox {...form.register('consent')} />
              <span>
                I agree to share my contact information with Trainovations so the
                team can follow up about my interest.
              </span>
            </label>
            {form.formState.errors.consent ? (
              <p className="text-sm text-danger">
                {errorMessage(form.formState.errors.consent)}
              </p>
            ) : null}

            {submissionState.status === 'error' ? (
              <p className="text-sm text-danger">{submissionState.message}</p>
            ) : null}

            <TVButton className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : 'Submit request'}
            </TVButton>
          </form>
        )}
      </TVDialogContent>
    </TVDialog>
  );
}
