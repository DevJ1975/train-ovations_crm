import { RepManagementList } from '@/components/admin/rep-management-list';
import { TVSectionHeader } from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getDashboardMetrics, getRepProfiles } from '@/lib/services';

import {
  inviteRepUserAction,
  offboardRepUserAction,
  resendRepInviteAction,
  updateRepProfileBasicAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function RepsPage() {
  const user = await requireAdminUser('/admin/reps');
  const [reps, metrics] = await Promise.all([
    getRepProfiles(user),
    getDashboardMetrics(user),
  ]);

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Reps"
        title="Rep management"
        description="Invite reps, monitor login state, resend onboarding access, offboard accounts safely, and update public profile fields."
      />
      <RepManagementList
        inviteAction={inviteRepUserAction}
        offboardAction={offboardRepUserAction}
        repPerformance={metrics.repPerformance}
        reps={reps.map((rep) => ({
          id: rep.id,
          userId: rep.user.id,
          slug: rep.slug,
          firstName: rep.firstName,
          lastName: rep.lastName,
          displayName: rep.displayName,
          title: rep.title,
          email: rep.email,
          phone: rep.phone,
          website: rep.website,
          location: rep.location,
          bio: rep.bio,
          isActive: rep.isActive,
          inviteStatus: rep.user.invitationAcceptedAt
            ? 'accepted'
            : rep.user.invitationSentAt
              ? 'pending'
              : 'not_invited',
          invitationSentAt: rep.user.invitationSentAt,
          invitationAcceptedAt: rep.user.invitationAcceptedAt,
          lastLoginAt: rep.user.lastLoginAt,
          ownedLeadCount: rep._count.ownedLeads,
          ownedAccountCount: rep._count.ownedAccounts,
          ownedOpportunityCount: rep._count.ownedOpportunities,
          landingPages: rep.landingPages,
        }))}
        resendInviteAction={resendRepInviteAction}
        updateAction={updateRepProfileBasicAction}
      />
    </div>
  );
}
