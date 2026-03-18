import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadDetailPanel } from './lead-detail-panel';

describe('LeadDetailPanel', () => {
  it('renders linked profile, movement alerts, expansion signals, and rep prompts', () => {
    render(
      <LeadDetailPanel
        lead={{
          id: 'ck1234567890123456789012',
          firstName: 'Taylor',
          lastName: 'Brooks',
          company: 'Northstar Rail',
          jobTitle: 'Operations Director',
          email: 'taylor@northstarrail.com',
          phone: null,
          location: 'Dallas, Texas',
          industry: null,
          interest: 'Safety program review',
          notes: null,
          consent: true,
          status: 'new',
          sourceType: 'landing_page',
          submittedAt: new Date('2026-03-13T00:00:00.000Z'),
          repProfile: {
            displayName: 'Jay Jones',
            slug: 'jay-jones',
            location: 'Phoenix, Arizona',
          },
          landingPage: { title: 'Jay Jones', slug: 'jay-jones' },
          duplicateOfLead: null,
          notesList: [],
          linkedInProfileLinks: [
            {
              id: 'link_1',
              profileUrl: 'https://www.linkedin.com/in/taylor-brooks',
              headline: 'Operations Director at Northstar Rail',
              location: 'Dallas, TX',
              sourceType: 'user_provided',
              status: 'active',
              confidenceScore: 0.95,
              humanConfirmed: true,
              officialData: false,
              lastCheckedAt: new Date('2026-03-13T00:00:00.000Z'),
              externalProfileSource: {
                label: 'Manual LinkedIn URL',
                provider: 'manual',
                isOfficial: false,
              },
            },
          ],
          employmentSnapshots: [
            {
              id: 'snap_1',
              title: 'Operations Director',
              companyName: 'Northstar Rail',
              startDate: new Date('2024-01-01T00:00:00.000Z'),
              endDate: null,
              isCurrent: true,
              companyPageUrl: null,
              sourceType: 'user_provided',
              confidenceScore: 0.91,
              retrievedAt: new Date('2026-03-13T00:00:00.000Z'),
              externalProfileSource: { label: 'Manual LinkedIn URL' },
            },
          ],
          employmentChangeEvents: [
            {
              id: 'change_1',
              changeType: 'company_changed',
              titleFrom: null,
              titleTo: null,
              companyFrom: 'Old Rail',
              companyTo: 'Northstar Rail',
              confidenceScore: 0.92,
              detectedAt: new Date('2026-03-13T00:00:00.000Z'),
            },
          ],
          profileMatchCandidates: [
            {
              id: 'candidate_1',
              profileUrl: 'https://www.linkedin.com/in/taylor-brooks',
              fullName: 'Taylor Brooks',
              title: 'Operations Director',
              companyName: 'Northstar Rail',
              sourceType: 'ai_inference',
              matchStatus: 'suggested',
              confidenceScore: 0.82,
              humanReviewed: false,
              externalProfileSource: { label: 'Profile match scoring' },
            },
          ],
          relationshipHistory: [
            {
              id: 'rel_1',
              companyName: 'Northstar Rail',
              title: 'Operations Director',
              stage: 'current',
              startDate: new Date('2024-01-01T00:00:00.000Z'),
              endDate: null,
              confidenceScore: 0.91,
              sourceType: 'user_provided',
              originType: 'external_source',
              repProfile: { displayName: 'Jay Jones' },
              externalProfileSource: { label: 'Manual LinkedIn URL' },
            },
          ],
          relationshipMilestones: [
            {
              id: 'milestone_1',
              milestoneType: 'employment_change',
              title: 'Moved to Northstar Rail',
              description: 'Relationship carried forward into a new account context.',
              occurredAt: new Date('2026-03-13T00:00:00.000Z'),
              confidenceScore: 0.88,
              originType: 'system_generated',
            },
          ],
          contactCompanyAssociations: [
            {
              id: 'assoc_1',
              companyName: 'Northstar Rail',
              associationType: 'target_account',
              status: 'active',
              isCurrent: true,
              isStrategic: true,
              confidenceScore: 0.86,
              startDate: new Date('2024-01-01T00:00:00.000Z'),
              endDate: null,
            },
          ],
          championFlag: {
            isActive: true,
            status: 'active',
            priority: 'strategic',
            rationale: 'Primary internal champion.',
            notes: 'Strong cross-functional influence.',
            ownerRepProfile: { displayName: 'Jay Jones' },
            confidenceScore: 0.9,
            originType: 'user_input',
          },
          contactWatchlist: {
            isActive: true,
            category: 'strategic_contact',
            priority: 'high',
            reason: 'High-value stakeholder.',
            notifyOnEmploymentChange: true,
            notifyOnTitleChange: true,
            notifyOnBrokenLink: true,
            notifyOnStaleData: true,
            notifyOnTargetCompanyMatch: true,
            originType: 'user_input',
          },
          careerMovementAlerts: [
            {
              id: 'alert_1',
              title: 'Company movement detected',
              message: 'Contact moved from Old Rail to Northstar Rail.',
              priority: 'high',
              status: 'open',
              suggestedNextStep: 'Reconnect and propose discovery.',
              confidenceScore: 0.92,
              triggeredAt: new Date('2026-03-13T00:00:00.000Z'),
              employmentChangeEvent: {
                changeType: 'company_changed',
              },
              externalProfileSource: { label: 'Manual LinkedIn URL' },
            },
          ],
          expansionOpportunitySignals: [
            {
              id: 'signal_1',
              opportunityType: 'warm_introduction',
              status: 'open',
              priority: 'high',
              companyName: 'Northstar Rail',
              title: 'Relationship opportunity at Northstar Rail',
              summary: 'A known contact joined a target account.',
              suggestedNextStep: 'Reconnect and schedule discovery.',
              rationale: 'Strategic target account.',
              confidenceScore: 0.9,
              createdAt: new Date('2026-03-13T00:00:00.000Z'),
            },
          ],
          repActionPrompts: [
            {
              id: 'prompt_1',
              promptType: 'schedule_discovery',
              status: 'open',
              priority: 'high',
              title: 'Act on relationship opportunity at Northstar Rail',
              message: 'A known contact joined a target account.',
              suggestedAction: 'Reconnect and schedule discovery.',
              createdAt: new Date('2026-03-13T00:00:00.000Z'),
            },
          ],
          outreachDrafts: [
            {
              id: 'draft_1',
              type: 'reentry',
              status: 'generated',
              subject: 'Congrats on the move to Northstar Rail',
              bodyText: 'Hi Taylor,\n\nCongratulations on the move.',
              recipientEmail: 'taylor@northstarrail.com',
              explanation: 'Generated because the contact moved to a strategic account.',
              suggestedCta: 'Reconnect with a short call.',
              confidenceScore: 0.82,
              generatedAt: new Date('2026-03-13T00:00:00.000Z'),
            },
          ],
          repTaskSuggestions: [
            {
              id: 'task_1',
              type: 'reconnect_contact',
              status: 'generated',
              priority: 'high',
              title: 'Reconnect with Taylor',
              reason: 'Open relationship signal at a strategic account.',
              explanation: 'Suggested because this contact moved to a valuable account.',
              recommendedDueAt: new Date('2026-03-15T00:00:00.000Z'),
              confidenceScore: 0.8,
            },
          ],
        }}
        activity={[]}
      />,
    );

    expect(screen.getByText(/LinkedIn Profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead stage progress: new/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead time comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Employment History/i)).toBeInTheDocument();
    expect(screen.getByText(/Career Movement Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Expansion Opportunity Signals/i)).toBeInTheDocument();
    expect(screen.getByText(/Rep Action Prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/Outreach Drafts/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Suggestions/i)).toBeInTheDocument();
    expect(screen.getByText(/Human confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/Company movement detected/i)).toBeInTheDocument();
    expect(
      screen.getByText('Relationship opportunity at Northstar Rail'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Act on relationship opportunity at Northstar Rail'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Congrats on the move to Northstar Rail'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reconnect with Taylor/i)).toBeInTheDocument();
  });
});
