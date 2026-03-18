import { redirect } from 'next/navigation';

import {
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVSectionHeader,
} from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepAccountsWorkspace, getRepOpportunitiesWorkspace, getRepLeadInbox } from '@/lib/services';
import { createProposalAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  const user = await requireAuthenticatedUser('/workspace/proposals/new');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const [leads, accounts, opportunities] = await Promise.all([
    getRepLeadInbox(user.id),
    getRepAccountsWorkspace(user.id),
    getRepOpportunitiesWorkspace(user.id),
  ]);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-2xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Proposals', href: '/workspace/proposals' },
              { label: 'New proposal' },
            ]}
          />
          <TVSectionHeader
            description="Set up the proposal context. Claude will use linked CRM data — notes, meeting history, opportunity details — to generate the content."
            eyebrow="Rep Tools"
            title="New proposal"
          />
        </div>

        <TVCard className="space-y-6 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Proposal details</TVCardTitle>
            <TVCardDescription>
              Link this proposal to a lead, account, or opportunity so Claude has full context when generating.
            </TVCardDescription>
          </div>

          <form action={createProposalAction} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="title">
                Proposal title
              </label>
              <TVInput
                id="title"
                name="title"
                placeholder="e.g. Trainovations Partnership Proposal for Acme Corp"
                required
                type="text"
              />
            </div>

            {leads.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="leadId">
                  Link to lead <span className="text-muted-foreground">(optional)</span>
                </label>
                <select
                  className="tv-form-select"
                  id="leadId"
                  name="leadId"
                >
                  <option value="">— None —</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName}
                      {lead.company ? ` · ${lead.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {accounts.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="accountId">
                  Link to account <span className="text-muted-foreground">(optional)</span>
                </label>
                <select
                  className="tv-form-select"
                  id="accountId"
                  name="accountId"
                >
                  <option value="">— None —</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                      {acc.industry ? ` · ${acc.industry}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {opportunities.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="opportunityId">
                  Link to opportunity <span className="text-muted-foreground">(optional)</span>
                </label>
                <select
                  className="tv-form-select"
                  id="opportunityId"
                  name="opportunityId"
                >
                  <option value="">— None —</option>
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.name} · {opp.account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <TVButton className="w-full" type="submit">
              Create proposal
            </TVButton>
          </form>
        </TVCard>
      </div>
    </main>
  );
}
