import { notFound } from 'next/navigation';

import { WorkspaceOverview } from '@/components/workspace/workspace-overview';
import { OnboardingWizard } from '@/components/workspace/onboarding-wizard';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';
import { getWorkspaceData } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage() {
  const user = await requireAuthenticatedUser('/workspace');
  const workspace = await getWorkspaceData(user.id, user.role);

  if (!workspace) {
    notFound();
  }

  // Show onboarding wizard for reps that haven't completed setup
  let showOnboarding = false;
  let onboardingProfile = null;
  if (user.role === 'sales_rep') {
    const db = getPrismaClient();
    const profile = await db.repProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        displayName: true,
        slug: true,
        title: true,
        bio: true,
        onboardingComplete: true,
      },
    });
    if (profile && !profile.onboardingComplete) {
      showOnboarding = true;
      onboardingProfile = profile;
    }
  }

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <WorkspaceOverview workspace={workspace} />
      </div>
      {showOnboarding && onboardingProfile && (
        <OnboardingWizard profile={onboardingProfile} />
      )}
    </main>
  );
}
