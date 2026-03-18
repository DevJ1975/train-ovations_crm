'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

import {
  TVButton,
  TVCard,
  TVInput,
  TVTextarea,
} from '@/components/trainovations';

interface OnboardingWizardProps {
  profile: {
    id: string;
    displayName: string;
    slug: string;
    title: string;
    bio: string;
  };
}

const STEPS = ['Welcome', 'Profile', 'Public page', 'Done'];

export function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [title, setTitle] = useState(profile.title);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${profile.slug}`
      : `/p/${profile.slug}`;

  async function saveProfile() {
    setSaving(true);
    try {
      await fetch('/api/workspace/rep-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, title, bio }),
      });
    } catch {
      toast.error('Could not save profile changes');
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch('/api/workspace/onboarding/complete', { method: 'POST' });
      router.refresh();
    } catch {
      toast.error('Something went wrong');
      setSaving(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <TVCard className="w-full max-w-lg space-y-6 rounded-[2rem] border-white/60 bg-white p-8 shadow-2xl">
        {/* Step pills */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                      ? 'border-2 border-primary text-primary'
                      : 'border border-border text-muted-foreground'
                }`}
              >
                {i < step ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span
                className={`text-xs hidden sm:block ${i === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xl font-semibold text-foreground">
                Welcome, {profile.displayName.split(' ')[0]} 👋
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Let&apos;s get your rep profile set up so leads see the best version of you. It
                only takes a minute.
              </p>
            </div>
            <TVButton className="w-full" onClick={() => setStep(1)}>
              Get started
            </TVButton>
          </div>
        )}

        {/* Step 1: Profile details */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-foreground">Your profile</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="ob-displayName">
                  Display name
                </label>
                <TVInput
                  id="ob-displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="ob-title">
                  Job title
                </label>
                <TVInput
                  id="ob-title"
                  placeholder="e.g. Senior Sales Rep"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="ob-bio">
                  Short bio
                </label>
                <TVTextarea
                  id="ob-bio"
                  placeholder="A sentence or two about what you do and who you help."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <TVButton variant="secondary" onClick={() => setStep(0)}>
                Back
              </TVButton>
              <TVButton
                className="flex-1"
                disabled={saving}
                onClick={async () => {
                  await saveProfile();
                  setStep(2);
                }}
              >
                {saving ? 'Saving…' : 'Save & continue'}
              </TVButton>
            </div>
          </div>
        )}

        {/* Step 2: Public page */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-foreground">Your public rep page</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this link with leads to let them learn about you and submit their info.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 p-3">
              <p className="flex-1 truncate text-sm font-mono text-foreground">{bookingUrl}</p>
              <button
                className="shrink-0 rounded-lg border bg-white p-1.5 hover:bg-surface-muted transition-colors"
                onClick={copyUrl}
                title="Copy link"
              >
                {copied ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex gap-3">
              <TVButton variant="secondary" onClick={() => setStep(1)}>
                Back
              </TVButton>
              <TVButton className="flex-1" onClick={() => setStep(3)}>
                Continue
              </TVButton>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">You&apos;re all set!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your profile is ready. Start adding leads, tracking opportunities, and closing
                deals.
              </p>
            </div>
            <TVButton className="w-full" disabled={saving} onClick={finish}>
              {saving ? 'Loading workspace…' : 'Go to workspace'}
            </TVButton>
          </div>
        )}
      </TVCard>
    </div>
  );
}
