export interface OnboardingRepProfile {
  bio: string;
  photoUrl: string | null;
  phone: string | null;
  connectedAccounts?: Array<{ provider: string }>;
  landingPages?: Array<unknown>;
}

export interface OnboardingStatus {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  isComplete: boolean;
  nextStep: 1 | 2 | 3 | null;
}

export function getOnboardingStatus(repProfile: OnboardingRepProfile): OnboardingStatus {
  const step1 = Boolean(repProfile.bio && repProfile.photoUrl && repProfile.phone);
  const step2 = Boolean(
    repProfile.connectedAccounts?.some((account) => account.provider.startsWith('google')),
  );
  const step3 = Boolean(repProfile.landingPages && repProfile.landingPages.length > 0);

  const isComplete = step1 && step2 && step3;

  let nextStep: 1 | 2 | 3 | null = null;
  if (!step1) {
    nextStep = 1;
  } else if (!step2) {
    nextStep = 2;
  } else if (!step3) {
    nextStep = 3;
  }

  return { step1, step2, step3, isComplete, nextStep };
}
