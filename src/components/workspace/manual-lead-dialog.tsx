'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';

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
  createManualLeadSchema,
  type CreateManualLeadInput,
} from '@/lib/validation/crm';

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

const defaultValues: CreateManualLeadInput = {
  firstName: '',
  lastName: '',
  company: '',
  jobTitle: '',
  email: '',
  phone: '',
  location: '',
  industry: '',
  interest: '',
  notes: '',
  consent: true,
  status: 'new',
};

interface EditableLeadValues {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  jobTitle: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  industry: string | null;
  interest: string | null;
  notes: string | null;
  consent: boolean;
  status: CreateManualLeadInput['status'];
  duplicateOfLeadId?: string | null;
}

function getLeadFormValues(lead?: EditableLeadValues): CreateManualLeadInput {
  if (!lead) {
    return defaultValues;
  }

  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company ?? '',
    jobTitle: lead.jobTitle ?? '',
    email: lead.email,
    phone: lead.phone ?? '',
    location: lead.location ?? '',
    industry: lead.industry ?? '',
    interest: lead.interest ?? '',
    notes: lead.notes ?? '',
    consent: true as const,
    status: lead.status,
  };
}

function getDialogCopy(isEditing: boolean) {
  return {
    triggerLabel: isEditing ? 'Edit lead' : 'Add lead manually',
    title: isEditing ? 'Edit lead' : 'Create lead',
    description: isEditing
      ? 'Update this contact without leaving the rep workspace.'
      : 'Add a contact directly to your queue when a lead comes in by phone, event, referral, or offline follow-up.',
    successMessage: isEditing
      ? 'Lead updated and saved to your rep workspace.'
      : 'Lead created and added to your rep queue.',
    submitIdleLabel: isEditing ? 'Save lead changes' : 'Create lead',
    submitBusyLabel: isEditing ? 'Saving lead...' : 'Creating lead...',
    openLeadLabel: isEditing ? 'Open updated lead' : 'Open created lead',
  };
}

function LeadFormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-label text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

interface DuplicateLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  company: string | null;
}

function useDuplicateCheck(email: string, firstName: string, lastName: string, skip: boolean) {
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skip || (!email && (!firstName || !lastName))) {
      setDuplicates([]);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (firstName) params.set('firstName', firstName);
      if (lastName) params.set('lastName', lastName);
      try {
        const res = await fetch(`/api/workspace/leads/check-duplicate?${params}`);
        if (res.ok) {
          const data = (await res.json()) as { duplicates: DuplicateLead[] };
          setDuplicates(data.duplicates ?? []);
        }
      } catch {
        // ignore
      }
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [email, firstName, lastName, skip]);

  return duplicates;
}

function LeadFormFields({
  form,
  isEditing,
}: {
  form: UseFormReturn<CreateManualLeadInput>;
  isEditing: boolean;
}) {
  const email = form.watch('email');
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const duplicates = useDuplicateCheck(email, firstName, lastName, isEditing);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeadFormField
          error={errorMessage(form.formState.errors.firstName)}
          htmlFor="manual-first-name"
          label="First name"
        >
          <TVInput id="manual-first-name" {...form.register('firstName')} />
        </LeadFormField>
        <LeadFormField
          error={errorMessage(form.formState.errors.lastName)}
          htmlFor="manual-last-name"
          label="Last name"
        >
          <TVInput id="manual-last-name" {...form.register('lastName')} />
        </LeadFormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LeadFormField htmlFor="manual-company" label="Company">
          <TVInput id="manual-company" {...form.register('company')} />
        </LeadFormField>
        <LeadFormField htmlFor="manual-job-title" label="Job title">
          <TVInput id="manual-job-title" {...form.register('jobTitle')} />
        </LeadFormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LeadFormField
          error={errorMessage(form.formState.errors.email)}
          htmlFor="manual-email"
          label="Email"
        >
          <TVInput id="manual-email" type="email" {...form.register('email')} />
        </LeadFormField>
        <LeadFormField htmlFor="manual-phone" label="Phone">
          <TVInput id="manual-phone" type="tel" {...form.register('phone')} />
        </LeadFormField>
      </div>

      <LeadFormField htmlFor="manual-location" label="Location">
        <TVInput
          id="manual-location"
          placeholder="Phoenix, Arizona"
          {...form.register('location')}
        />
      </LeadFormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <LeadFormField htmlFor="manual-industry" label="Industry">
          <TVInput id="manual-industry" {...form.register('industry')} />
        </LeadFormField>
        <LeadFormField htmlFor="manual-interest" label="Interest">
          <TVInput id="manual-interest" {...form.register('interest')} />
        </LeadFormField>
      </div>

      <LeadFormField htmlFor="manual-notes" label="Notes">
        <TVTextarea id="manual-notes" {...form.register('notes')} />
      </LeadFormField>

      <label className="flex items-start gap-3 rounded-lg border bg-surface-muted p-4 text-sm text-muted-foreground">
        <TVCheckbox {...form.register('consent')} />
        <span>
          I confirmed this contact agreed to share their information and receive follow-up from
          Trainovations.
        </span>
      </label>

      {duplicates.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 space-y-2">
          <p className="text-sm font-medium text-yellow-800">
            Possible duplicate{duplicates.length > 1 ? 's' : ''} found
          </p>
          {duplicates.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3">
              <p className="text-sm text-yellow-700">
                {d.firstName} {d.lastName} — {d.email}
                {d.company ? ` · ${d.company}` : ''}
              </p>
              <Link
                className="shrink-0 text-xs font-medium text-yellow-800 underline hover:no-underline"
                href={`/workspace/leads/${d.id}`}
                target="_blank"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LeadFormSuccessState({
  message,
  duplicateLeadId,
  savedLeadId,
  openLeadLabel,
  onClose,
}: {
  message: string;
  duplicateLeadId: string | null;
  savedLeadId: string | null;
  openLeadLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-surface-muted p-4 text-sm text-foreground">
        {message}
      </p>
      {duplicateLeadId ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
          We found a possible duplicate for this lead. Review the existing record before creating
          parallel follow-up.
        </p>
      ) : null}
      <TVButton className="w-full" onClick={onClose}>
        Close
      </TVButton>
      {savedLeadId ? (
        <TVButton asChild className="w-full" variant="secondary">
          <Link href={`/workspace/leads/${savedLeadId}`}>{openLeadLabel}</Link>
        </TVButton>
      ) : null}
      {duplicateLeadId ? (
        <TVButton asChild className="w-full" variant="ghost">
          <Link href={`/workspace/leads/${duplicateLeadId}`}>Review possible duplicate</Link>
        </TVButton>
      ) : null}
    </div>
  );
}

export function ManualLeadDialog({
  onCreated,
  lead,
  triggerLabel,
}: {
  onCreated?: () => unknown | Promise<unknown>;
  lead?: EditableLeadValues;
  triggerLabel?: string;
}) {
  const isEditing = Boolean(lead);
  const copy = getDialogCopy(isEditing);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [duplicateLeadId, setDuplicateLeadId] = useState<string | null>(lead?.duplicateOfLeadId ?? null);
  const [submissionState, setSubmissionState] = useState<
    { status: 'idle' } | { status: 'success'; message: string } | { status: 'error'; message: string }
  >({ status: 'idle' });
  const resolvedDefaultValues = getLeadFormValues(lead);

  const form = useForm<CreateManualLeadInput>({
    resolver: zodResolver(createManualLeadSchema),
    defaultValues: resolvedDefaultValues,
  });

  async function onSubmit(values: CreateManualLeadInput) {
    setIsSubmitting(true);
    setSubmissionState({ status: 'idle' });
    setDuplicateLeadId(null);

    const response = await fetch(lead ? `/api/workspace/leads/${lead.id}` : '/api/workspace/leads', {
      method: lead ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; fieldErrors?: Record<string, string[]>; duplicate?: { id: string } }
        | null;

      if (response.status === 409 && payload?.duplicate?.id) {
        setDuplicateLeadId(payload.duplicate.id);
        setSubmissionState({
          status: 'error',
          message: 'A lead with this email already exists in your queue.',
        });
        return;
      }

      if (payload?.fieldErrors) {
        for (const [field, errors] of Object.entries(payload.fieldErrors)) {
          if (errors?.length) {
            form.setError(field as keyof CreateManualLeadInput, {
              type: 'server',
              message: errors[0],
            });
          }
        }
      }

      setSubmissionState({
        status: 'error',
        message: payload?.error ?? 'We could not create the lead right now.',
      });
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { lead?: { id?: string; duplicateOfLeadId?: string | null } }
      | null;

    setSavedLeadId(payload?.lead?.id ?? lead?.id ?? null);
    setDuplicateLeadId(payload?.lead?.duplicateOfLeadId ?? null);
    setSubmissionState({
      status: 'success',
      message: copy.successMessage,
    });
    await onCreated?.();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(resolvedDefaultValues);
      setSavedLeadId(null);
      setDuplicateLeadId(lead?.duplicateOfLeadId ?? null);
      setSubmissionState({ status: 'idle' });
    }
  }

  return (
    <TVDialog open={open} onOpenChange={handleOpenChange}>
      <TVButton onClick={() => setOpen(true)} variant={isEditing ? 'secondary' : 'primary'}>
        {triggerLabel ?? copy.triggerLabel}
      </TVButton>
      <TVDialogContent className="max-h-[90vh] overflow-y-auto">
        <TVDialogHeader>
          <TVDialogTitle>{copy.title}</TVDialogTitle>
          <TVDialogDescription>{copy.description}</TVDialogDescription>
        </TVDialogHeader>

        {submissionState.status === 'success' ? (
          <LeadFormSuccessState
            duplicateLeadId={duplicateLeadId}
            message={submissionState.message}
            onClose={() => setOpen(false)}
            openLeadLabel={copy.openLeadLabel}
            savedLeadId={savedLeadId}
          />
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <LeadFormFields form={form} isEditing={isEditing} />

            {submissionState.status === 'error' ? (
              <p className="text-sm text-danger">{submissionState.message}</p>
            ) : null}

            <TVButton className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? copy.submitBusyLabel : copy.submitIdleLabel}
            </TVButton>
          </form>
        )}
      </TVDialogContent>
    </TVDialog>
  );
}
