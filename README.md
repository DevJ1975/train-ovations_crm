# Trainovations CRM

This repository now includes Trainovations CRM through Phase 14 Stage 5, covering the MVP foundation plus integrations, meeting intelligence, relationship intelligence, outreach intelligence, operational CRM maturity, and rep execution/scheduling including calendar, tasks, and the rep accounts and pipeline surfaces.

## Current Status

Implemented phases in this repository include:

- Next.js App Router foundation
- TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, React Testing Library
- Prisma setup scaffolding
- Centralized Trainovations design token system
- Initial Trainovations UI wrapper components
- Auth.js credentials authentication
- Role-aware sessions and protected admin routes
- Seeded MVP users for auth testing
- Core CRM Prisma models, validation schemas, services, and Stage 2 seed data
- Public rep landing page route and branded Stage 3 public experience
- Real Save Contact / vCard download flow for public rep pages
- Lead capture modal and submission API for public rep pages
- Admin dashboard, leads workspace, and rep management pages
- Task-to-calendar scheduling: schedule, reschedule, snooze, and overdue treatment from the rep task center and calendar workspace
- Rep Accounts workspace: account cards with contacts, open deal count, and pipeline value
- Rep Pipeline workspace: stage-grouped opportunity view with inline stage movement and next step editing
- AI Proposal Generator: Claude-powered proposals with SOW, pricing, timeline, and per-section rewrite — shareable public view at /proposal/[token]
- Google Sign-In plus modular Google, Zoom, and Notion integration architecture
- Connected account models, Zoom webhook ingestion, and future meeting-automation job scaffolding
- Meeting completion processing, AI meeting summaries, action items, and follow-up draft generation
- LinkedIn identity linking, employment snapshots, relationship history, and career movement alert architecture
- Champion tracking, watchlists, expansion signals, and rep action prompts
- Outreach intelligence foundations for drafts, briefs, priorities, and task suggestions
- Infrastructure foundations for TanStack tables/query, BullMQ, Upstash rate limiting, QR generation, React Email templating, MSW, Sentry, and OCR parsing seams
- Project documentation and build log

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL and update `DATABASE_URL` in `.env`.

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build production app
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest
- `npm run test:watch` - Run Vitest in watch mode
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations
- `npm run prisma:seed` - Seed database

## Architecture Notes

- App framework: Next.js App Router
- Styling: Tailwind CSS backed by Trainovations design tokens and CSS variables
- UI layer: Trainovations wrapper components in `src/components/trainovations`
- Data layer: Prisma + PostgreSQL
- Auth layer: Auth.js credentials provider with modular authorization helpers
- External integrations: Google Sign-In plus separate Workspace OAuth scopes, Zoom webhook ingestion, and Notion sync scaffolding
- Data layer services: reps, landing pages, leads, notes, and activity logging
- Public landing pages: `/rep/[slug]` using formatted public data and Trainovations components
- Save Contact export: downloadable `.vcf` files from public rep pages
- Lead capture: modal UI and `/api/public/leads` submission route on rep landing pages
- Admin: dashboard metrics, lead review, lead detail, and rep management surfaces
- Integrations settings: `/settings/integrations` for provider connection state and sync preferences
- Contact intelligence: provenance-aware LinkedIn profile links, employment snapshots, champion flags, and career movement alerts on lead detail pages
- Rep workspace: `/workspace` with lead inbox, QR sharing, and business-card OCR capture handoff
- Queue foundation: BullMQ-based producers and typed job definitions for meeting processing, Notion sync, enrichment, email draft generation, and OCR work
- Observability: centralized Sentry-ready capture through `ObservabilityService`
- Testing: MSW-backed external API mocks for Google, Notion, and Resend flows

## Environment Notes

The `.env.example` file now includes the main local and platform variables for:

- auth URLs and secrets
- Google, Zoom, and Notion integrations
- Redis / BullMQ
- Upstash rate limiting
- Resend email rendering/sending
- Sentry server and client instrumentation

## Documentation

- [CRM design](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/trainovations-crm-design.md)
- [Stage 1 auth notes](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-1-auth.md)
- [Stage 2 data architecture](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-2-data-architecture.md)
- [Stage 3 public pages](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-3-public-pages.md)
- [Stage 4 vCard](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-4-vcard.md)
- [Stage 5 lead capture](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-5-lead-capture.md)
- [Stage 6 admin workspace](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-6-admin.md)
- [Stage 7 integrations foundation](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-7-integrations.md)
- [Build log](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/build-log.md)
- [LinkedIn identity and career movement](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/linkedin-identity.md)
- [Infrastructure packages](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/infrastructure-packages.md)
- [Queue architecture](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/queue-architecture.md)
- [Observability](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/observability.md)
- [Outreach intelligence](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/outreach-intelligence.md)
- [Relationship intelligence](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/relationship-intelligence.md)
- [Roles and permissions](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/roles-and-permissions.md)
- [Testing strategy](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/testing-strategy.md)
- [Phase 13 operational CRM roadmap](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/phase-13-operational-crm-roadmap.md)
- [Phase 14 rep execution and scheduling](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/phase-14-rep-execution-and-scheduling.md)
