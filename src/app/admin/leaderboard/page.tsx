import { AdminLeaderboard } from '@/components/admin/admin-leaderboard';
import { requireAdminUser } from '@/lib/auth/server';
import { getRepLeaderboard } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  await requireAdminUser('/admin/leaderboard');
  const entries = await getRepLeaderboard();

  return <AdminLeaderboard entries={entries} />;
}
