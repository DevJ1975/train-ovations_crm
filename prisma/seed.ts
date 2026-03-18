import {
  ActivityLogType,
  LeadStatus,
  PrismaClient,
  SocialPlatform,
  SourceType,
  UserRole,
} from '@prisma/client';

import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

const seedUsers = [
  {
    name: 'Avery Admin',
    email: 'admin@trainovations.com',
    password: 'Trainovations123!',
    role: UserRole.super_admin,
  },
  {
    name: 'Morgan Manager',
    email: 'manager@trainovations.com',
    password: 'Trainovations123!',
    role: UserRole.sales_manager,
  },
  {
    name: 'Jay Jones',
    email: 'jay.jones@trainovations.com',
    password: 'Trainovations123!',
    role: UserRole.sales_rep,
  },
  {
    name: 'Casey Rivera',
    email: 'casey.rivera@trainovations.com',
    password: 'Trainovations123!',
    role: UserRole.sales_rep,
  },
];

async function main() {
  const organization = await prisma.organizationSettings.upsert({
    where: { id: 'trainovations-org' },
    update: {
      name: 'Trainovations',
      supportEmail: 'support@trainovations.com',
      supportPhone: '800-555-0100',
      website: 'https://trainovations.com',
      defaultLeadSource: SourceType.landing_page,
    },
    create: {
      id: 'trainovations-org',
      name: 'Trainovations',
      supportEmail: 'support@trainovations.com',
      supportPhone: '800-555-0100',
      website: 'https://trainovations.com',
      defaultLeadSource: SourceType.landing_page,
    },
  });

  const usersByEmail = new Map<string, { id: string; role: UserRole }>();

  for (const user of seedUsers) {
    const passwordHash = await hashPassword(user.password);

    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
        isActive: true,
      },
    });

    usersByEmail.set(createdUser.email, {
      id: createdUser.id,
      role: createdUser.role,
    });
  }

  const repSeeds = [
    {
      userEmail: 'jay.jones@trainovations.com',
      managerEmail: 'manager@trainovations.com',
      slug: 'jay-jones',
      firstName: 'Jay',
      lastName: 'Jones',
      displayName: 'Jay Jones',
      title: 'Safety Technology Specialist',
      bio: 'Jay helps rail and transit organizations modernize field training, compliance communication, and rep-driven relationship management.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      email: 'jay.jones@trainovations.com',
      phone: '555-101-2201',
      website: 'https://trainovations.com/jay-jones',
      location: 'Phoenix, Arizona',
      signature: {
        companyName: organization.name,
        jobTitle: 'Safety Technology Specialist',
        primaryPhone: '555-101-2201',
        email: 'jay.jones@trainovations.com',
        website: 'https://trainovations.com',
        linkedinUrl: 'https://linkedin.com/in/jay-jones',
        calendarUrl: 'https://cal.com/jay-jones',
        address: '1200 Enterprise Rail Pkwy, Phoenix, AZ',
      },
      socialLinks: [
        {
          platform: SocialPlatform.linkedin,
          label: 'LinkedIn',
          url: 'https://linkedin.com/in/jay-jones',
          sortOrder: 0,
        },
        {
          platform: SocialPlatform.custom,
          label: 'Book Time',
          url: 'https://cal.com/jay-jones',
          sortOrder: 1,
        },
      ],
      landingPage: {
        slug: 'jay-jones',
        title: 'Jay Jones | Trainovations',
        headline: 'Connect with Jay Jones',
        subheadline: 'Trainovations support for rail and transit training programs.',
        heroCtaText: 'Save Contact',
        metaTitle: 'Jay Jones - Trainovations',
        metaDescription: 'Digital business card and lead capture page for Jay Jones.',
      },
    },
    {
      userEmail: 'casey.rivera@trainovations.com',
      managerEmail: 'manager@trainovations.com',
      slug: 'casey-rivera',
      firstName: 'Casey',
      lastName: 'Rivera',
      displayName: 'Casey Rivera',
      title: 'Enterprise Account Executive',
      bio: 'Casey partners with transportation and industrial safety teams to deploy Trainovations training workflows across distributed organizations.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      email: 'casey.rivera@trainovations.com',
      phone: '555-101-2202',
      website: 'https://trainovations.com/casey-rivera',
      location: 'Denver, Colorado',
      signature: {
        companyName: organization.name,
        jobTitle: 'Enterprise Account Executive',
        primaryPhone: '555-101-2202',
        email: 'casey.rivera@trainovations.com',
        website: 'https://trainovations.com',
        linkedinUrl: 'https://linkedin.com/in/casey-rivera',
        calendarUrl: 'https://cal.com/casey-rivera',
        address: '800 Operations Center Dr, Denver, CO',
      },
      socialLinks: [
        {
          platform: SocialPlatform.linkedin,
          label: 'LinkedIn',
          url: 'https://linkedin.com/in/casey-rivera',
          sortOrder: 0,
        },
        {
          platform: SocialPlatform.youtube,
          label: 'Product Videos',
          url: 'https://youtube.com/@trainovations',
          sortOrder: 1,
        },
      ],
      landingPage: {
        slug: 'casey-rivera',
        title: 'Casey Rivera | Trainovations',
        headline: 'Meet Casey Rivera',
        subheadline: 'Enterprise training support for safety-forward operations teams.',
        heroCtaText: 'Save Contact',
        metaTitle: 'Casey Rivera - Trainovations',
        metaDescription: 'Digital business card and lead capture page for Casey Rivera.',
      },
    },
  ];

  const repProfiles = new Map<string, { repProfileId: string; landingPageId: string }>();

  for (const rep of repSeeds) {
    const user = usersByEmail.get(rep.userEmail);
    const manager = usersByEmail.get(rep.managerEmail);

    if (!user) {
      throw new Error(`Seed user not found for ${rep.userEmail}`);
    }

    if (!manager) {
      throw new Error(`Seed manager not found for ${rep.managerEmail}`);
    }

    const repProfile = await prisma.repProfile.upsert({
      where: { userId: user.id },
      update: {
        slug: rep.slug,
        firstName: rep.firstName,
        lastName: rep.lastName,
        displayName: rep.displayName,
        title: rep.title,
        bio: rep.bio,
        photoUrl: rep.photoUrl,
        email: rep.email,
        phone: rep.phone,
        website: rep.website,
        location: rep.location,
        managerUserId: manager.id,
        isActive: true,
        onboardingComplete: true,
      },
      create: {
        userId: user.id,
        managerUserId: manager.id,
        slug: rep.slug,
        firstName: rep.firstName,
        lastName: rep.lastName,
        displayName: rep.displayName,
        title: rep.title,
        bio: rep.bio,
        photoUrl: rep.photoUrl,
        email: rep.email,
        phone: rep.phone,
        website: rep.website,
        location: rep.location,
        isActive: true,
        onboardingComplete: true,
      },
    });

    await prisma.repSignatureProfile.upsert({
      where: { repProfileId: repProfile.id },
      update: rep.signature,
      create: {
        repProfileId: repProfile.id,
        ...rep.signature,
      },
    });

    await prisma.repSocialLink.deleteMany({
      where: { repProfileId: repProfile.id },
    });

    await prisma.repSocialLink.createMany({
      data: rep.socialLinks.map((link) => ({
        repProfileId: repProfile.id,
        ...link,
      })),
    });

    const landingPage = await prisma.landingPage.upsert({
      where: { slug: rep.landingPage.slug },
      update: {
        repProfileId: repProfile.id,
        ...rep.landingPage,
        isPublished: true,
      },
      create: {
        repProfileId: repProfile.id,
        ...rep.landingPage,
        isPublished: true,
      },
    });

    repProfiles.set(rep.slug, {
      repProfileId: repProfile.id,
      landingPageId: landingPage.id,
    });
  }

  const exampleLeads = [
    {
      repSlug: 'jay-jones',
      firstName: 'Alex',
      lastName: 'Stone',
      company: 'Metro Transit Systems',
      jobTitle: 'Training Director',
      email: 'alex.stone@metrotransit.com',
      phone: '555-202-3301',
      location: 'Dallas, Texas',
      industry: 'Transit',
      interest: 'Field training modernization',
      notes: 'Requested a follow-up demo for operations leadership.',
      consent: true,
      status: LeadStatus.new,
    },
    {
      repSlug: 'casey-rivera',
      firstName: 'Jordan',
      lastName: 'Lee',
      company: 'Iron Summit Logistics',
      jobTitle: 'Safety Manager',
      email: 'jordan.lee@ironsummit.com',
      phone: '555-202-3302',
      location: 'Chicago, Illinois',
      industry: 'Industrial Safety',
      interest: 'Compliance tracking and mobile training access',
      notes: 'Interested in enterprise rollout timing.',
      consent: true,
      status: LeadStatus.contacted,
    },
  ];

  const createdLeadsByEmail = new Map<string, { id: string; repProfileId: string | null }>();

  for (const lead of exampleLeads) {
    const repContext = repProfiles.get(lead.repSlug);

    if (!repContext) {
      throw new Error(`Rep context not found for ${lead.repSlug}`);
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        email: lead.email,
        repProfileId: repContext.repProfileId,
      },
    });

    const { repSlug: _repSlug, ...leadFields } = lead;

    const leadData = {
      repProfileId: repContext.repProfileId,
      landingPageId: repContext.landingPageId,
      ...leadFields,
      sourceType: SourceType.landing_page,
    };

    const createdLead = existingLead
      ? await prisma.lead.update({
          where: { id: existingLead.id },
          data: leadData,
        })
      : await prisma.lead.create({
          data: leadData,
        });

    await prisma.activityLog.create({
      data: {
        type: ActivityLogType.lead_created,
        description: `Seed lead created for ${createdLead.firstName} ${createdLead.lastName}.`,
        repProfileId: createdLead.repProfileId ?? undefined,
        leadId: createdLead.id,
        metadata: {
          seeded: true,
        },
      },
    });

    createdLeadsByEmail.set(createdLead.email, {
      id: createdLead.id,
      repProfileId: createdLead.repProfileId,
    });
  }

  const exampleAccounts = [
    {
      name: 'Metro Transit Systems',
      domain: 'metrotransit.com',
      industry: 'Transit',
      status: 'prospect' as const,
      ownerRepSlug: 'jay-jones',
      hqLocation: 'Phoenix, Arizona',
      description: 'Transit operator exploring field training modernization and operational compliance workflows.',
      primaryLeadEmail: 'alex.stone@metrotransit.com',
      relationshipLabel: 'Training Director',
      opportunity: {
        name: 'Metro Transit Pilot Rollout',
        stage: 'discovery' as const,
        amountCents: 85000_00,
        targetCloseDate: new Date('2026-05-15T00:00:00.000Z'),
        description: 'Pilot deployment for operations and frontline training teams.',
      },
    },
    {
      name: 'Iron Summit Logistics',
      domain: 'ironsummit.com',
      industry: 'Industrial Safety',
      status: 'prospect' as const,
      ownerRepSlug: 'casey-rivera',
      hqLocation: 'Denver, Colorado',
      description: 'Safety organization evaluating a broader compliance and mobile training rollout.',
      primaryLeadEmail: 'jordan.lee@ironsummit.com',
      relationshipLabel: 'Safety Manager',
      opportunity: {
        name: 'Iron Summit Enterprise Rollout',
        stage: 'proposal' as const,
        amountCents: 240000_00,
        targetCloseDate: new Date('2026-06-01T00:00:00.000Z'),
        description: 'Enterprise-wide training platform rollout tied to compliance modernization.',
      },
    },
  ];

  const createdAccountsByName = new Map<string, { id: string; ownerRepProfileId: string | null }>();
  const createdOpportunitiesByName = new Map<string, { id: string }>();

  for (const account of exampleAccounts) {
    const repContext = repProfiles.get(account.ownerRepSlug);
    const leadContext = createdLeadsByEmail.get(account.primaryLeadEmail);

    if (!repContext) {
      throw new Error(`Account owner rep context not found for ${account.ownerRepSlug}`);
    }

    if (!leadContext) {
      throw new Error(`Primary lead not found for ${account.primaryLeadEmail}`);
    }

    const existingAccount = await prisma.account.findFirst({
      where: {
        name: account.name,
        ownerRepProfileId: repContext.repProfileId,
      },
    });

    const createdAccount = existingAccount
      ? await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            domain: account.domain,
            industry: account.industry,
            status: account.status,
            hqLocation: account.hqLocation,
            description: account.description,
          },
        })
      : await prisma.account.create({
          data: {
            name: account.name,
            domain: account.domain,
            industry: account.industry,
            status: account.status,
            ownerRepProfileId: repContext.repProfileId,
            hqLocation: account.hqLocation,
            description: account.description,
          },
        });

    createdAccountsByName.set(createdAccount.name, {
      id: createdAccount.id,
      ownerRepProfileId: createdAccount.ownerRepProfileId,
    });

    await prisma.accountContact.upsert({
      where: {
        accountId_leadId: {
          accountId: createdAccount.id,
          leadId: leadContext.id,
        },
      },
      update: {
        relationshipLabel: account.relationshipLabel,
        isPrimary: true,
      },
      create: {
        accountId: createdAccount.id,
        leadId: leadContext.id,
        relationshipLabel: account.relationshipLabel,
        isPrimary: true,
      },
    });

    const existingOpportunity = await prisma.opportunity.findFirst({
      where: {
        accountId: createdAccount.id,
        name: account.opportunity.name,
      },
    });

    if (existingOpportunity) {
      const updatedOpportunity = await prisma.opportunity.update({
        where: { id: existingOpportunity.id },
        data: {
          ownerRepProfileId: repContext.repProfileId,
          primaryLeadId: leadContext.id,
          stage: account.opportunity.stage,
          amountCents: account.opportunity.amountCents,
          targetCloseDate: account.opportunity.targetCloseDate,
          description: account.opportunity.description,
        },
      });
      createdOpportunitiesByName.set(updatedOpportunity.name, {
        id: updatedOpportunity.id,
      });
    } else {
      const createdOpportunity = await prisma.opportunity.create({
        data: {
          accountId: createdAccount.id,
          ownerRepProfileId: repContext.repProfileId,
          primaryLeadId: leadContext.id,
          name: account.opportunity.name,
          stage: account.opportunity.stage,
          amountCents: account.opportunity.amountCents,
          targetCloseDate: account.opportunity.targetCloseDate,
          description: account.opportunity.description,
        },
      });
      createdOpportunitiesByName.set(createdOpportunity.name, {
        id: createdOpportunity.id,
      });
    }
  }

  const mailboxSeeds = [
    {
      userEmail: 'jay.jones@trainovations.com',
      provider: 'gmail' as const,
      label: 'Jay inbox',
      emailAddress: 'jay.jones@trainovations.com',
      threads: [
        {
          subject: 'Metro Transit pilot follow-up',
          snippet: 'Thanks for the walkthrough. Can you share pilot pricing and timeline options?',
          participants: ['alex.stone@metrotransit.com', 'jay.jones@trainovations.com'],
          unreadCount: 1,
          lastMessageAt: new Date('2026-03-14T16:15:00.000Z'),
          leadEmail: 'alex.stone@metrotransit.com',
          accountName: 'Metro Transit Systems',
          opportunityName: 'Metro Transit Pilot Rollout',
          messages: [
            {
              direction: 'outbound' as const,
              fromEmail: 'jay.jones@trainovations.com',
              toEmails: ['alex.stone@metrotransit.com'],
              bodyText: 'Great meeting today. I am attaching the pilot outline and next-step options for the operations team.',
              sentAt: new Date('2026-03-14T15:20:00.000Z'),
              isRead: true,
            },
            {
              direction: 'inbound' as const,
              fromEmail: 'alex.stone@metrotransit.com',
              toEmails: ['jay.jones@trainovations.com'],
              bodyText: 'Thanks for the walkthrough. Can you share pilot pricing and timeline options?',
              sentAt: new Date('2026-03-14T16:15:00.000Z'),
              isRead: false,
            },
          ],
        },
      ],
    },
    {
      userEmail: 'casey.rivera@trainovations.com',
      provider: 'gmail' as const,
      label: 'Casey inbox',
      emailAddress: 'casey.rivera@trainovations.com',
      threads: [
        {
          subject: 'Iron Summit rollout review',
          snippet: 'We reviewed the proposal internally and would like to discuss rollout sequencing next week.',
          participants: ['jordan.lee@ironsummit.com', 'casey.rivera@trainovations.com'],
          unreadCount: 0,
          lastMessageAt: new Date('2026-03-14T13:40:00.000Z'),
          leadEmail: 'jordan.lee@ironsummit.com',
          accountName: 'Iron Summit Logistics',
          opportunityName: 'Iron Summit Enterprise Rollout',
          messages: [
            {
              direction: 'inbound' as const,
              fromEmail: 'jordan.lee@ironsummit.com',
              toEmails: ['casey.rivera@trainovations.com'],
              bodyText: 'We reviewed the proposal internally and would like to discuss rollout sequencing next week.',
              sentAt: new Date('2026-03-14T13:40:00.000Z'),
              isRead: true,
            },
          ],
        },
      ],
    },
  ];

  for (const mailboxSeed of mailboxSeeds) {
    const user = usersByEmail.get(mailboxSeed.userEmail);

    if (!user) {
      throw new Error(`Mailbox user not found for ${mailboxSeed.userEmail}`);
    }

    const mailbox = await prisma.emailMailbox.upsert({
      where: {
        userId_emailAddress: {
          userId: user.id,
          emailAddress: mailboxSeed.emailAddress,
        },
      },
      update: {
        provider: mailboxSeed.provider,
        connectionStatus: 'connected',
        label: mailboxSeed.label,
        syncEnabled: true,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: user.id,
        provider: mailboxSeed.provider,
        connectionStatus: 'connected',
        label: mailboxSeed.label,
        emailAddress: mailboxSeed.emailAddress,
        syncEnabled: true,
        lastSyncedAt: new Date(),
      },
    });

    for (const threadSeed of mailboxSeed.threads) {
      const lead = createdLeadsByEmail.get(threadSeed.leadEmail);
      const account = createdAccountsByName.get(threadSeed.accountName);
      const opportunity = createdOpportunitiesByName.get(threadSeed.opportunityName);

      if (!lead) {
        throw new Error(`Inbox lead not found for ${threadSeed.leadEmail}`);
      }

      const existingThread = await prisma.emailThread.findFirst({
        where: {
          mailboxId: mailbox.id,
          subject: threadSeed.subject,
        },
      });

      const thread = existingThread
        ? await prisma.emailThread.update({
            where: { id: existingThread.id },
            data: {
              repProfileId: lead.repProfileId ?? undefined,
              leadId: lead.id,
              accountId: account?.id,
              opportunityId: opportunity?.id,
              snippet: threadSeed.snippet,
              participants: threadSeed.participants,
              unreadCount: threadSeed.unreadCount,
              lastMessageAt: threadSeed.lastMessageAt,
              status: 'open',
            },
          })
        : await prisma.emailThread.create({
            data: {
              mailboxId: mailbox.id,
              repProfileId: lead.repProfileId ?? undefined,
              leadId: lead.id,
              accountId: account?.id,
              opportunityId: opportunity?.id,
              subject: threadSeed.subject,
              snippet: threadSeed.snippet,
              participants: threadSeed.participants,
              unreadCount: threadSeed.unreadCount,
              lastMessageAt: threadSeed.lastMessageAt,
              status: 'open',
            },
          });

      await prisma.emailMessage.deleteMany({
        where: {
          threadId: thread.id,
        },
      });

      await prisma.emailMessage.createMany({
        data: threadSeed.messages.map((message) => ({
          threadId: thread.id,
          direction: message.direction,
          subject: threadSeed.subject,
          snippet: threadSeed.snippet,
          bodyText: message.bodyText,
          fromEmail: message.fromEmail,
          toEmails: message.toEmails,
          isRead: message.isRead,
          sentAt: message.sentAt,
        })),
      });
    }
  }

  // ── Proposal Templates (global) ───────────────────────────────────────────

  const proposalTemplateDefs = [
    {
      name: 'Safety Training Partnership',
      description: 'A full-service proposal for organizations building or modernizing a safety training program.',
      category: 'Safety',
      isGlobal: true,
      blocks: [
        {
          blockType: 'hero',
          position: 0,
          content: {
            heading: 'Your Safety Training Partnership',
            subheading: 'Trainovations partners with organizations like yours to build world-class safety training programs that protect your people and reduce compliance risk.',
            ctaText: 'Review the Proposal',
            ctaScrollToBlockType: 'package_selector',
          },
        },
        {
          blockType: 'problem_solution',
          position: 1,
          content: {
            problemTitle: 'Outdated Training Isn\'t Enough',
            problemDescription: 'Many organizations still rely on classroom slide decks, paper sign-in sheets, and tribal knowledge to manage safety compliance. This leads to inconsistent training quality, audit exposure, and preventable incidents.',
            solutionTitle: 'Modern, Mobile-First Safety Training',
            solutionDescription: 'Trainovations delivers structured, mobile-accessible safety curricula backed by real-time tracking, digital certification, and manager dashboards — so your team is always ready for the field and the audit.',
          },
        },
        {
          blockType: 'deliverables',
          position: 2,
          content: {
            columns: 2,
            items: [
              { title: 'Customized Training Curriculum', description: 'Role-specific learning paths built around your operational environment and hazard profile.' },
              { title: 'Mobile-First Content Delivery', description: 'Field workers can complete training from any device, anytime, without needing a laptop or a classroom.' },
              { title: 'Digital Certification & Records', description: 'Automated certificates, expiry tracking, and audit-ready digital records.' },
              { title: 'Manager Dashboard', description: 'Real-time visibility into completion rates, overdue certifications, and incident-linked training gaps.' },
              { title: 'Compliance Reporting', description: 'One-click compliance reports formatted for OSHA, DOT, and internal audit requirements.' },
              { title: 'Onboarding & Change Management', description: 'Dedicated onboarding sessions, adoption playbooks, and rep support through go-live.' },
            ],
          },
        },
        {
          blockType: 'scope',
          position: 3,
          content: {
            included: [
              'Custom curriculum design and content migration',
              'Up to 5 role-based training tracks',
              'Admin and manager training',
              'Integration with your HRIS or scheduling system (if applicable)',
              'Dedicated implementation rep for 90 days',
              '12-month platform license',
            ],
            excluded: [
              'Third-party content licensing fees',
              'Hardware procurement or device management',
              'Ongoing content creation beyond initial build',
            ],
          },
        },
        {
          blockType: 'timeline',
          position: 4,
          content: {
            phases: [
              { title: 'Discovery & Kick-off', description: 'Roles assessment, hazard mapping, and curriculum outline sign-off.', duration: '1–2 weeks', startOffset: 'Week 1' },
              { title: 'Content Build', description: 'Course authoring, media production, and review cycles.', duration: '3–4 weeks', startOffset: 'Week 2' },
              { title: 'Platform Configuration', description: 'Branding, user provisioning, and system integrations.', duration: '1–2 weeks', startOffset: 'Week 6' },
              { title: 'Pilot Rollout', description: 'Limited launch with a pilot cohort to validate content and workflow.', duration: '2 weeks', startOffset: 'Week 7' },
              { title: 'Full Deployment', description: 'Organization-wide launch with manager and field-crew onboarding.', duration: '1 week', startOffset: 'Week 9' },
              { title: 'Ongoing Success', description: 'Quarterly check-ins, content refresh review, and compliance report delivery.', duration: 'Ongoing', startOffset: 'Month 3+' },
            ],
          },
        },
        {
          blockType: 'package_selector',
          position: 5,
          content: {
            allowMultiple: false,
            instruction: 'Select the package that fits your team size and compliance requirements.',
          },
        },
        {
          blockType: 'testimonial',
          position: 6,
          content: {
            quote: 'Trainovations turned our paper-based safety program into a real system. Our audit pass rate went from 74% to 98% in the first year.',
            authorName: 'Sam Okafor',
            authorTitle: 'VP of Safety & Compliance',
            authorCompany: 'Heartland Rail Group',
            rating: 5,
          },
        },
        {
          blockType: 'faq',
          position: 7,
          content: {
            items: [
              { question: 'How long does implementation take?', answer: 'Most organizations complete full deployment within 8–10 weeks. Larger enterprises or those requiring complex integrations may take 12–14 weeks.' },
              { question: 'Can we migrate our existing training content?', answer: 'Yes. Our team will audit your existing materials and reformat or rebuild content to fit the Trainovations delivery format.' },
              { question: 'What happens after the initial contract period?', answer: 'We offer annual renewal agreements with options to expand training tracks, users, or add-ons like the incident linkage module.' },
              { question: 'Is the platform compliant with OSHA 10/30 requirements?', answer: 'Trainovations supports OSHA-aligned content structures. For formal OSHA card issuance, we integrate with authorized outreach programs upon request.' },
            ],
          },
        },
        {
          blockType: 'signature',
          position: 8,
          content: {
            instruction: 'By signing below, you confirm your intent to move forward with the selected package and authorize Trainovations to begin the scoping process.',
            requireFullName: true,
            requireTitle: true,
            requireDate: true,
            agreementText: 'This proposal is valid for 30 days from the issue date. Final contract terms will be issued upon signature and deposit.',
          },
        },
        {
          blockType: 'payment',
          position: 9,
          content: {
            title: 'Secure Your Partnership',
            description: 'A 25% deposit secures your implementation slot. The remainder is due upon platform go-live.',
            showPackageSummary: true,
          },
        },
      ],
    },
    {
      name: 'Equipment Training Program',
      description: 'Hands-on equipment certification and operator training for industrial and transit environments.',
      category: 'Equipment',
      isGlobal: true,
      blocks: [
        {
          blockType: 'hero',
          position: 0,
          content: {
            heading: 'Equipment Operator Training That Sticks',
            subheading: 'Hands-on, role-specific training programs that certify your operators, reduce equipment-related incidents, and keep your fleet running.',
            ctaText: 'See What\'s Included',
            ctaScrollToBlockType: 'deliverables',
          },
        },
        {
          blockType: 'rich_text',
          position: 1,
          content: {
            html: '<h2>About Trainovations</h2><p>Trainovations specializes in field-ready training programs for organizations operating heavy equipment, specialized vehicles, and safety-critical systems. Our instructional design team works alongside your SMEs to build certification programs that reflect your exact operating environment — not a generic textbook.</p><p>We serve transit agencies, logistics operators, energy companies, and industrial manufacturers across North America.</p>',
          },
        },
        {
          blockType: 'deliverables',
          position: 2,
          content: {
            columns: 2,
            items: [
              { title: 'Pre-Operation Inspection Modules', description: 'Step-by-step digital walkarounds with photo documentation for each equipment type.' },
              { title: 'Operator Certification Tracks', description: 'Progressive skill-level tracks with written knowledge checks and practical sign-offs.' },
              { title: 'Incident Scenario Library', description: 'Scenario-based learning covering the top 10 equipment incident types in your industry.' },
              { title: 'Refresher & Recertification Flows', description: 'Automated recertification reminders and streamlined refresher modules for license renewals.' },
              { title: 'Instructor-Led Session Support', description: 'Train-the-trainer kits and virtual instructor support for in-person practical assessments.' },
              { title: 'Equipment-Specific Digital Records', description: 'Tied to VIN or asset ID, so every operator\'s certification history follows the equipment.' },
            ],
          },
        },
        {
          blockType: 'timeline',
          position: 3,
          content: {
            phases: [
              { title: 'Equipment & Role Audit', description: 'Inventory your equipment types, operator roles, and current certification gaps.', duration: '1 week', startOffset: 'Week 1' },
              { title: 'Curriculum Design', description: 'Custom content built around your equipment manuals, SOPs, and incident history.', duration: '2–3 weeks', startOffset: 'Week 2' },
              { title: 'Practical Assessment Design', description: 'Checklists, sign-off forms, and instructor evaluation rubrics.', duration: '1 week', startOffset: 'Week 4' },
              { title: 'Pilot Cohort', description: 'First certification run with a selected group; debrief and revise.', duration: '2 weeks', startOffset: 'Week 5' },
              { title: 'Full Rollout', description: 'All operators complete initial certification before the deadline.', duration: '2–4 weeks', startOffset: 'Week 7' },
            ],
          },
        },
        {
          blockType: 'roi_value',
          position: 4,
          content: {
            headline: 'The ROI of Certified Operators',
            metrics: [
              { label: 'Reduction in Equipment Incidents', value: '↓ 42%', description: 'Average incident reduction reported by clients in year one.' },
              { label: 'Certification Completion Rate', value: '97%', description: 'Trainovations-managed programs vs. 61% industry average for self-managed programs.' },
              { label: 'Audit Readiness', value: 'Day 1', description: 'Digital records are always current, so you\'re audit-ready every day — not just before a visit.' },
              { label: 'Time to Certify New Hires', value: '↓ 60%', description: 'Structured digital pathways cut onboarding certification time significantly.' },
            ],
          },
        },
        {
          blockType: 'package_selector',
          position: 5,
          content: {
            allowMultiple: false,
            instruction: 'Choose the certification program tier that matches your equipment count and operator volume.',
          },
        },
        {
          blockType: 'testimonial',
          position: 6,
          content: {
            quote: 'We certified 140 operators across three sites in six weeks. The digital records alone saved us from what would have been a very expensive DOT audit.',
            authorName: 'Marcus Trent',
            authorTitle: 'Fleet Safety Director',
            authorCompany: 'Ironclad Freight Solutions',
            rating: 5,
          },
        },
        {
          blockType: 'cta',
          position: 7,
          content: {
            heading: 'Ready to Certify Your Team?',
            subheading: 'Review your selected package below and sign to lock in your implementation slot.',
            buttonText: 'Sign the Proposal',
            buttonAction: 'scroll_to_signature',
          },
        },
        {
          blockType: 'signature',
          position: 8,
          content: {
            instruction: 'Sign below to confirm your selected training package and authorize the Trainovations team to begin scoping.',
            requireFullName: true,
            requireTitle: false,
            requireDate: true,
            agreementText: 'This proposal is valid for 30 days. Trainovations will issue a formal service agreement within 3 business days of signature.',
          },
        },
      ],
    },
    {
      name: 'Executive Leadership Training',
      description: 'A leadership development and executive training proposal for senior teams and emerging leaders.',
      category: 'Leadership',
      isGlobal: true,
      blocks: [
        {
          blockType: 'hero',
          position: 0,
          content: {
            heading: 'Invest in the Leaders Who Drive Your Mission',
            subheading: 'Structured, high-impact leadership development programs for executives, senior managers, and high-potential emerging leaders.',
            ctaText: 'Explore the Program',
            ctaScrollToBlockType: 'scope',
          },
        },
        {
          blockType: 'problem_solution',
          position: 1,
          content: {
            problemTitle: 'Leadership Gaps Cost More Than You Think',
            problemDescription: 'Organizations routinely promote high performers into leadership roles without giving them the tools to lead effectively. The result: burnout, turnover, misaligned teams, and strategic drift — all of which carry real financial cost.',
            solutionTitle: 'Structured Leadership Development, Not Just a Workshop',
            solutionDescription: 'Trainovations designs longitudinal leadership programs — not one-day events. We combine cohort-based learning, 1:1 coaching integration, and applied on-the-job projects to build leaders who actually lead differently after the program ends.',
          },
        },
        {
          blockType: 'scope',
          position: 2,
          content: {
            included: [
              'Leadership competency assessment and cohort diagnostic',
              'Custom curriculum mapped to your organizational values and strategic priorities',
              'Cohort sessions (virtual or in-person, 6–12 participants)',
              'Applied project framework with peer feedback loops',
              'Manager toolkit and debrief sessions for program sponsors',
              'Completion credentials for each participant',
            ],
            excluded: [
              'Executive 1:1 coaching (available as add-on)',
              'Travel and venue costs for in-person sessions',
              'Pre-existing LMS integration (quoted separately)',
            ],
          },
        },
        {
          blockType: 'roi_value',
          position: 3,
          content: {
            headline: 'What Strong Leadership Delivers',
            metrics: [
              { label: 'Manager-Driven Attrition', value: '↓ 35%', description: 'Trained managers retain their direct reports longer and contribute to a stronger culture.' },
              { label: 'Internal Promotion Rate', value: '↑ 2.4×', description: 'Clients with structured leadership pipelines promote internally at more than twice the rate.' },
              { label: 'Employee Engagement', value: '+28 pts', description: 'Average engagement score improvement reported by teams with leadership-trained managers.' },
              { label: 'Strategic Alignment', value: '91%', description: 'Of program participants report significantly clearer alignment between team work and organizational strategy.' },
            ],
          },
        },
        {
          blockType: 'timeline',
          position: 4,
          content: {
            phases: [
              { title: 'Diagnostic & Design', description: 'Cohort assessment, stakeholder interviews, and curriculum customization.', duration: '2–3 weeks', startOffset: 'Week 1' },
              { title: 'Cohort Session 1', description: 'Foundations — self-aware leadership, communication styles, and psychological safety.', duration: '1 day', startOffset: 'Week 4' },
              { title: 'Applied Project Sprint', description: 'Participants apply session learnings to a real organizational challenge.', duration: '3 weeks', startOffset: 'Week 5' },
              { title: 'Cohort Session 2', description: 'Strategic Thinking — decision frameworks, prioritization, and managing up.', duration: '1 day', startOffset: 'Week 8' },
              { title: 'Cohort Session 3', description: 'Leading Change — navigating ambiguity, building coalition, and managing resistance.', duration: '1 day', startOffset: 'Week 12' },
              { title: 'Graduation & Sponsor Debrief', description: 'Participant presentations, manager toolkit handoff, and program close.', duration: '0.5 days', startOffset: 'Week 14' },
            ],
          },
        },
        {
          blockType: 'package_selector',
          position: 5,
          content: {
            allowMultiple: false,
            instruction: 'Select the program tier for your cohort size and delivery format.',
          },
        },
        {
          blockType: 'scheduling',
          position: 6,
          content: {
            heading: 'Schedule Your Discovery Call',
            description: 'Before we finalize the program design, we\'d like to learn more about your leadership priorities and cohort profile. Book a 30-minute call below.',
            schedulingUrl: '',
            embedType: 'link',
          },
        },
        {
          blockType: 'faq',
          position: 7,
          content: {
            items: [
              { question: 'What is the ideal cohort size?', answer: 'We recommend 6–12 participants per cohort. Smaller groups allow deeper peer learning; larger groups can be split into pods of 4–5 with a shared plenary experience.' },
              { question: 'Can this be delivered virtually?', answer: 'Yes. All sessions are available in fully virtual, hybrid, or in-person formats. Virtual sessions are delivered live on Zoom or Teams with interactive workshop facilitation.' },
              { question: 'How is the program customized?', answer: 'We conduct a diagnostic survey with participants and interviews with 2–3 senior sponsors before the first session. This data shapes case studies, scenarios, and language throughout the program.' },
              { question: 'Do participants receive formal credentials?', answer: 'Yes. Each participant receives a digital certificate of completion. We can also align the curriculum with recognized leadership frameworks (CCL, DiSC, etc.) upon request.' },
            ],
          },
        },
        {
          blockType: 'signature',
          position: 8,
          content: {
            instruction: 'By signing below, you confirm your intent to enroll your cohort and authorize Trainovations to begin the program diagnostic process.',
            requireFullName: true,
            requireTitle: true,
            requireDate: true,
            agreementText: 'This proposal is valid for 30 days. A formal program agreement and kickoff calendar will be delivered within 5 business days of signature.',
          },
        },
        {
          blockType: 'payment',
          position: 9,
          content: {
            title: 'Reserve Your Cohort Slot',
            description: 'A 50% deposit reserves your program dates. The remainder is due at the start of Session 2.',
            showPackageSummary: true,
          },
        },
      ],
    },
  ];

  for (const tpl of proposalTemplateDefs) {
    const existing = await prisma.proposalTemplate.findFirst({
      where: { name: tpl.name, isGlobal: true },
    });

    const template = existing
      ? await prisma.proposalTemplate.update({
          where: { id: existing.id },
          data: {
            description: tpl.description,
            category: tpl.category,
            isGlobal: tpl.isGlobal,
          },
        })
      : await prisma.proposalTemplate.create({
          data: {
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            isGlobal: tpl.isGlobal,
          },
        });

    // Always rebuild blocks so content stays fresh
    await prisma.proposalTemplateBlock.deleteMany({ where: { templateId: template.id } });
    await prisma.proposalTemplateBlock.createMany({
      data: tpl.blocks.map((b) => ({
        templateId: template.id,
        blockType: b.blockType as import('@prisma/client').ProposalBlockType,
        position: b.position,
        content: b.content,
      })),
    });
  }

  console.log('Stage 2 seed data created for Trainovations CRM domain models.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
