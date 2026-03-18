'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';

import { TVButton, TVBadge } from '@/components/trainovations';
import { cn } from '@/lib/utils';

const DISMISS_STORAGE_KEY = 'onboarding_banner_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const STEPS = [
  { label: '1. Fill Profile', key: 1 as const },
  { label: '2. Connect Google', key: 2 as const },
  { label: '3. Preview Page', key: 3 as const },
];

const STEP_DETAILS: Record<
  number,
  { description: string; buttonLabel: string; href: string }
> = {
  1: {
    description: 'Add your bio, photo, and phone number to activate your public rep profile.',
    buttonLabel: 'Edit Profile',
    href: '/workspace/profile',
  },
  2: {
    description:
      'Connect your Google account to enable calendar sync and inbox threading.',
    buttonLabel: 'Connect Google',
    href: '/settings/integrations',
  },
  3: {
    description:
      'Preview and share your public landing page to start capturing leads.',
    buttonLabel: 'View Public Page',
    href: '/rep/[slug]',
  },
};

interface OnboardingBannerProps {
  currentStep: number;
  isComplete: boolean;
  repSlug?: string;
  step1Complete?: boolean;
  step2Complete?: boolean;
  step3Complete?: boolean;
}

export function OnboardingBanner({
  currentStep,
  isComplete,
  repSlug,
  step1Complete = false,
  step2Complete = false,
  step3Complete = false,
}: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        setIsDismissed(true);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  if (isComplete || isDismissed) {
    return null;
  }

  function handleDismiss() {
    try {
      localStorage.setItem(
        DISMISS_STORAGE_KEY,
        String(Date.now() + DISMISS_DURATION_MS),
      );
    } catch {
      // localStorage may not be available
    }
    setIsDismissed(true);
  }

  const stepCompleted = [step1Complete, step2Complete, step3Complete];
  const detail = STEP_DETAILS[currentStep];
  const href =
    currentStep === 3 && repSlug
      ? detail.href.replace('[slug]', repSlug)
      : detail?.href ?? '/workspace';

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-foreground">Complete your rep setup</p>
            <TVBadge className="bg-warning/15 text-warning" variant="default">
              Step {currentStep} of 3
            </TVBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {STEPS.map((step) => {
              const completed = stepCompleted[step.key - 1];
              const active = step.key === currentStep;
              return (
                <span
                  key={step.key}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                    completed
                      ? 'bg-success/15 text-success'
                      : active
                        ? 'bg-warning/20 text-warning'
                        : 'bg-surface-muted text-muted-foreground',
                  )}
                >
                  {completed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          type="button"
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>

      {detail && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">{detail.description}</p>
          <TVButton asChild size="sm" variant="secondary">
            <Link href={href}>{detail.buttonLabel}</Link>
          </TVButton>
        </div>
      )}
    </div>
  );
}
