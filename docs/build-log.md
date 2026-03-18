# Build Log

## 2026-03-13 - Stage 0

Completed:

- Bootstrapped a Next.js App Router + TypeScript project structure from an empty repository
- Added Tailwind CSS, ESLint, Prettier, Vitest, and React Testing Library configuration
- Created Trainovations design tokens with Tailwind theme mapping and CSS variable exposure
- Added initial Trainovations wrapper components: button, card, input, badge, section header, dialog, and table
- Added Prisma schema, Prisma client helper, seed scaffold, and environment example
- Replaced the placeholder README with project setup and architecture guidance
- Added initial Stage 0 smoke tests for token availability and landing page rendering

Assumptions:

- Trainovations LMS uses a clean enterprise blue/orange palette consistent with the brief
- Exact LMS brand assets and production color specs are not yet available in the repository
- PostgreSQL will be the runtime database, but local setup is not yet provisioned in this repo

Verification:

- Static Stage 0 scaffolding has been created
- Semantic token usage was checked to avoid scattered raw Tailwind color utilities in `src/`
- Dependency installation and command verification still require package installation in this environment

Next:

- Stage 1: Auth.js setup, role model introduction, protected admin routes, seed users

## 2026-03-13 - Stage 1

Completed:

- Added a Prisma `User` model and `UserRole` enum for `super_admin`, `sales_manager`, and `sales_rep`
- Implemented Auth.js credentials login with Prisma-backed user lookup and bcrypt password verification
- Added modular auth utilities for credential validation, session shaping, role checks, and protected-route decisions
- Protected the `/admin` route group with a reusable server-side admin guard
- Added a login page, logout flow, and minimal authenticated admin shell
- Seeded 1 super admin, 1 sales manager, and 2 sales rep accounts
- Added tests for role guards, login validation, and session role mapping

Assumptions:

- MVP auth uses credentials only for now, with JWT sessions instead of database-backed NextAuth session tables
- `sales_rep` users should authenticate successfully but should not have access to `/admin`
- A single shared seed password is acceptable for local MVP setup and documentation

Verification:

- `npm install` completed successfully
- `npx prisma generate` completed successfully
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 2: Rep profile models, signature profiles, and social link structures

## 2026-03-13 - Stage 2

Completed:

- Expanded Prisma with normalized CRM models for reps, landing pages, leads, notes, and activity logs
- Added enums for lead status, social platform, source type, and activity log type
- Implemented Zod schemas for rep, signature, social link, landing page, lead, and lead note workflows
- Added service-layer operations for rep profiles, landing pages, leads, duplicate detection, notes, and activity logs
- Extended seed data with organization settings, rep profiles, signature profiles, social links, landing pages, and example leads
- Added Stage 2 tests for validation, rep services, landing page lookup, lead creation, duplicate detection, and activity log creation

Assumptions:

- Each sales rep maps to at most one `RepProfile` in Phase 1
- Duplicate detection is intentionally lightweight for MVP and matches by normalized email or phone within the same rep owner
- A rep can own multiple landing pages later, but Stage 2 seed data creates one primary page per rep

Verification:

- Prisma schema formatted successfully
- Stage 2 migration SQL generated at `prisma/migrations/20260313183000_stage2_data_architecture/migration.sql`
- `npx prisma validate` passed with a local `DATABASE_URL` placeholder
- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 3: Public rep landing pages backed by the new data layer

## 2026-03-13 - Stage 3

Completed:

- Added the public rep landing route at `/rep/[slug]`
- Implemented a public landing page formatter/service for shaping branded public data
- Built a polished mobile-first public rep page with Trainovations branding, identity, trust content, CTAs, social links, and footer
- Added a branded not-found experience for invalid rep slugs
- Added a placeholder Save Contact endpoint for future Stage 4 vCard expansion
- Added tests for public data formatting, social link rendering, and public landing page rendering

Assumptions:

- A landing page slug is the canonical public lookup key for the rep experience
- Stage 3 keeps lead capture as a visible CTA placeholder instead of implementing submission logic early
- The placeholder vCard endpoint is acceptable as a stable integration point before Stage 4 expands the export fields

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 4: Save Contact export details and full vCard generation

## 2026-03-13 - Stage 4

Completed:

- Replaced the placeholder Save Contact endpoint with a real vCard download response
- Added a dedicated public vCard builder utility for valid `.vcf` payload generation
- Used public rep and signature profile data to populate full name, title, company, phone, email, website, and LinkedIn
- Kept the existing public landing page Save Contact button wired to the now-live endpoint
- Added tests for vCard formatting, endpoint behavior, and invalid slug handling

Assumptions:

- `RepSignatureProfile` is the preferred source for contact card identity fields when present
- A compact vCard 3.0 format is the right MVP target for broad mobile compatibility
- Additional public links beyond the primary website and LinkedIn should stay limited to a small labeled set to keep the export clean

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 5: Lead capture modal and lead submission flow

## 2026-03-13 - Stage 5

Completed:

- Added a public lead capture dialog to the rep landing page
- Implemented the public lead submission route at `/api/public/leads`
- Added public lead submission validation including hidden slug/query/timestamp fields
- Added honeypot and lightweight rate limiting protections for public lead submissions
- Added a service flow that resolves landing page metadata, assigns the rep, checks duplicates, creates the lead, and logs duplicate activity when needed
- Added tests for the lead capture dialog, public submission route, public schema, rate limiting, and public lead service path
- Added a Stage 5 Prisma migration for the new duplicate-detection activity log enum value

Assumptions:

- A lightweight timed modal is acceptable for MVP as long as it does not appear immediately on page load
- Public lead submission is centralized under `/api/public/leads` while still carrying rep and landing metadata in the payload
- Validation failures should return a clean generic message from the API while field-level validation remains on the client

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 6: Admin dashboard lead management and rep management surfaces

## 2026-03-13 - Stage 6

Completed:

- Implemented the admin dashboard with summary cards for total leads, recent leads, leads by rep, and leads by status
- Implemented the leads list page with search, status filtering, rep filtering, and a structured lead table
- Added the lead detail page with core identity fields, source context, duplicate flag visibility, notes, and activity timeline
- Implemented the rep management page with basic editable profile fields, slug visibility, active status, and public page preview links
- Added admin service functions for dashboard metrics, lead listing/detail retrieval, timeline lookup, rep listing, and basic rep updates
- Added tests for admin services and critical admin rendering components

Assumptions:

- Existing admin-role protection from the shared admin layout is sufficient practical coverage for Stage 6 route protection
- Rep management can use a basic server action form for MVP editing without a separate API layer yet
- Dashboard analytics should stay operationally useful but intentionally lightweight until later stages

Verification:

- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Stage 7: Polish, documentation cleanup, and final MVP readiness pass

## 2026-03-13 - Stage 7

Completed:

- Added Google Sign-In alongside credentials auth with database-backed role/session mapping
- Added normalized integration models for connected accounts, calendar events, meetings, meeting artifacts, automation jobs, summaries, action items, sync records, and webhook events
- Added modular Google, Zoom, and Notion integration services plus an automation orchestrator scaffold
- Added integration OAuth connect/callback routes and a verified Zoom webhook ingestion endpoint
- Added `/settings/integrations` for provider connection status, scope visibility, and sync or automation preference toggles
- Added tests for connected-account lifecycle behavior, Google token refresh logic, Zoom webhook verification and ingestion, and integration permission checks
- Added Stage 7 environment scaffolding and documentation for provider architecture and future meeting-intelligence flow

Assumptions:

- Google Sign-In should create Trainovations-domain users as `sales_rep` accounts when they do not already exist
- Google Workspace data access should remain separate from basic sign-in to support incremental authorization cleanly
- Notion OAuth exchange remains a scaffold for now and should be replaced with a full token exchange before production rollout

Verification:

- Stage 7 migration SQL generated at `prisma/migrations/20260313195500_stage7_integrations_foundation/migration.sql`
- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Finalize full Prisma generation and verification pass
- Extend provider workers when meeting sync and AI summary execution begin

## 2026-03-13 - Phase 8 Stage 1

Completed:

- Extended Prisma models to support verified meeting facts, participant records, meeting artifacts, AI summaries, AI-generated CRM notes, follow-up email drafts, and richer Notion sync linkage
- Added new enums for artifact availability, note provenance, draft state, participant roles, and expanded automation job types for meeting-intelligence workflows
- Linked meetings to leads, reps, calendar events, and future generated outputs while preserving the CRM as the source of truth
- Added typed validation contracts for meeting records, participants, artifacts, summaries, action items, drafts, and AI-generated notes
- Added Stage 1 tests covering the new meeting-intelligence schemas and auditable output contracts
- Added the Phase 8 Stage 1 migration SQL for the new data architecture

Assumptions:

- Source-backed meeting facts and AI-generated outputs must stay in separate tables or fields rather than being mixed into raw meeting payloads
- `CallSummary` remains the primary structured record for generated meeting intelligence, while `LeadNote` stores user-visible CRM notes with explicit provenance
- Follow-up email drafts should be first-class records before any sending workflow is introduced

Verification:

- `npx prisma validate` passed
- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Phase 8 Stage 2: meeting completion processing and artifact persistence

## 2026-03-13 - Phase 8 Stage 2

Completed:

- Added a dedicated Zoom meeting completion service that resolves rep ownership, upserts meetings, links leads and calendar events when available, and records verified meeting metadata
- Added participant persistence for completed Zoom meetings
- Added meeting artifact persistence for recordings, transcripts, and chat metadata, including explicit missing-artifact placeholders when Zoom does not provide them
- Updated the Zoom webhook route so it delegates meeting persistence to the new service and only queues automation after a meeting is successfully processed
- Added service-layer and route tests for processed, ignored, and missing-artifact meeting completion scenarios

Assumptions:

- Zoom completion payload tracking fields are the best MVP source for lead and calendar association when present
- Missing recordings or transcripts should be stored explicitly as missing source-backed artifacts instead of being inferred later
- Meetings that cannot be tied to an existing meeting or a connected rep account should be ignored rather than orphaned

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Phase 8 Stage 3: AI meeting intelligence service for summaries, action items, and follow-up drafts

## 2026-03-13 - Phase 8 Stage 3

Completed:

- Added a production-minded `MeetingIntelligenceService` with a pluggable provider abstraction for summary generation, action item extraction, next-step recommendation, and follow-up draft creation
- Implemented a deterministic heuristic provider as the current default so the system can generate typed outputs without pretending an external LLM integration is complete
- Added evidence extraction that prefers transcripts, then chat, then metadata-only fallback, with generation metadata capturing the evidence source
- Persisted generated outputs into `CallSummary`, `ActionItem`, `EmailDraft`, and AI-labeled `LeadNote` records while keeping them separate from verified meeting facts
- Added tests for transcript-backed generation, persistence mapping, and provider swapping contracts

Assumptions:

- A deterministic internal provider is acceptable for this stage as long as the abstraction remains replaceable and the metadata clearly reflects the generation source
- AI-generated notes should be stored immediately as CRM-readable records, but explicitly marked as AI-generated
- Refreshing intelligence for a meeting can replace prior generated action items and archive prior draft follow-ups for the same meeting

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Phase 8 Stage 4: CRM activity logging and explicit meeting-note creation workflow polish

## 2026-03-13 - Phase 8 Stage 4

Completed:

- Added explicit meeting-intelligence CRM activity logging for generated summaries, AI meeting notes, and follow-up draft creation
- Upgraded the lead-note service to support meeting-specific audit events without breaking the existing generic lead-note workflow
- Updated the meeting intelligence pipeline so AI-generated notes are logged as meeting-note events instead of generic lead-note events
- Added dedicated activity metadata tying meeting-generated CRM records back to the meeting, call summary, evidence source, and email draft
- Added regression coverage for custom lead-note activity logging and the meeting-intelligence activity trail

Assumptions:

- A meeting-driven CRM note should remain a `LeadNote`, but its audit entry should reflect that it came from processed meeting intelligence rather than manual authoring
- Summary generation, note creation, and follow-up drafting are distinct CRM events and should be logged separately for traceability
- Backward compatibility for existing `createLeadNote` callers is more important than introducing a breaking signature change

Verification:

- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Phase 8 Stage 5: Google Calendar follow-up creation flow

## 2026-03-13 - Phase 9

Completed:

- Extended Prisma with compliance-minded LinkedIn identity, employment snapshot, relationship history, champion tracking, watchlist, and career movement alert models
- Added provenance-aware enums and activity log types to distinguish official LinkedIn data, user-provided links, third-party enrichment, and AI inference
- Implemented modular services for manual LinkedIn profile linking, confidence-based profile matching, employment snapshot refresh, relationship graph maintenance, and career movement alert generation
- Added confidence scoring, human confirmation, source attribution, and timestamp handling across profile links, match candidates, employment snapshots, and alert records
- Extended the admin lead detail experience with a linked profile block, employment history, relationship history, champion and watchlist controls, and movement alerts
- Added tests for profile link normalization, profile match suggestions and confirmation, employment change detection, alert priority logic, provenance handling, and lead-detail rendering
- Added the Phase 9 migration SQL for LinkedIn identity and career movement architecture

Assumptions:

- Manual LinkedIn URL linking and human-confirmed profile matching are the primary compliant MVP flows until official consenting LinkedIn identity access is available
- The CRM remains the system of record; LinkedIn-related data is stored as sourced snapshots with confidence and provenance rather than treated as immutable truth
- Company and title changes should create auditable change events and alerts, while stale or broken profile states should remain visible without pretending the system has fresh verified data

Verification:

- `npx prisma validate` passed
- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed

Next:

- Phase 10: decide whether to deepen LinkedIn consent flows, extend enrichment providers, or build workflow actions on top of career movement alerts

## 2026-03-13 - Phase 10 Stage 1

Completed:

- Extended Prisma for relationship-intelligence Stage 1 with richer champion lifecycle, watchlist categorization, relationship provenance, and new models for milestones, company associations, expansion signals, rep prompts, and lightweight relationship edges
- Added future-facing enums for champion status and priority, record origin, milestone types, company association types, expansion opportunity state, rep action prompt state, and relationship edge types
- Preserved backward compatibility with the existing Phase 9 relationship and LinkedIn services by keeping prior champion and watchlist fields intact while layering in richer defaults
- Added typed validation contracts for relationship milestones, company associations, expansion opportunity signals, rep action prompts, and relationship edges
- Added Stage 1 validation coverage for expanded champion/watchlist payloads and the new relationship-intelligence contracts
- Added a Phase 10 Stage 1 Prisma migration SQL file for the new schema surface

Assumptions:

- Trainovations can model account relevance and relationship graphs in relational tables first, without introducing a dedicated graph database
- Existing `Lead` records continue to function as the core contact identity for relationship intelligence until a future dedicated account/contact abstraction is warranted
- Stage 1 focuses on data architecture and validation contracts only; champion automation, expansion scoring, and rep prompt orchestration land in later Phase 10 stages

Verification:

- `npx prisma validate` passed
- `npx prisma generate` passed
- focused relationship-intelligence validation tests passed

Next:

- Phase 10 Stage 2: implement champion tracking and watchlist services on top of the new schema

## 2026-03-13 - Phase 10 Stage 2

Completed:

- Added `ChampionTrackingService` to manage champion lifecycle defaults, owner-aware updates, audit logging, and milestone creation
- Added `ContactWatchlistService` to manage watchlist activation, preference persistence, audit logging, and strategic-watch milestones
- Kept the older `RelationshipGraphService` as a compatibility layer by delegating champion and watchlist updates into the new Phase 10 services
- Updated admin lead-detail actions to use the new services and capture the acting admin for audit entries
- Added service-layer tests for champion lifecycle transitions and watchlist activation/reprioritization behavior

Assumptions:

- Deactivating an active champion should default to `former` status unless a more specific lifecycle status is supplied later
- Champion and watchlist changes should create auditable CRM activity immediately, while milestone creation should happen only on meaningful state changes
- Existing admin forms can keep their simpler payloads for now because richer status/priority/category controls will land in later Phase 10 UI stages

Verification:

- focused champion/watchlist service tests passed
- `npm run lint` passed

Next:

- Phase 10 Stage 3: implement relationship history and lightweight relationship graph services on top of the new schema

## 2026-03-13 - Phase 10 Stage 3

Completed:

- Added `RelationshipHistoryService` to own employment-snapshot-to-history syncing, current-employer company association tracking, relationship milestone creation, and timeline retrieval
- Extended `RelationshipGraphService` with lightweight retrieval methods for lead relationship graphs and rep relationship context
- Moved employment snapshot syncing onto the dedicated history service while preserving the existing Phase 9 employment-change workflow
- Added tests for relationship history syncing, combined relationship timeline retrieval, lead relationship graph shaping, rep context retrieval, and the updated employment-change path

Assumptions:

- A lead-level relationship graph is best represented as a combination of relationship history, milestones, company associations, and typed edges instead of a separate graph engine
- Current-employer company associations should automatically downgrade prior current-employer associations for the same lead
- Stage 3 is still service-layer focused, so the richer graph/timeline UI remains for later Phase 10 stages

Verification:

- focused relationship history/graph tests passed
- `npm run lint` passed

Next:

- Phase 10 Stage 4: implement career movement alert generation and expansion opportunity evaluation on top of the relationship data

## 2026-03-13 - Phase 10 Stage 4

Completed:

- Extended `CareerMovementAlertService` so movement alerts now record explicit alert-creation activity, carry suggested next steps, and distinguish strategically relevant company moves in the title and message
- Added `ExpansionOpportunityService` to evaluate company moves against relationship/company-association context and create reviewable expansion or re-entry signals
- Integrated expansion-opportunity evaluation into the employment-change pipeline so company changes can produce both CRM alerts and strategic opportunity signals
- Added service-layer tests for movement-alert activity logging, expansion scoring, and the integrated employment-change flow

Assumptions:

- Strategic account relevance can be inferred from existing `ContactCompanyAssociation` records for now, without requiring a full account master model in this stage
- Competitor moves should not create expansion signals, even though they may still create movement alerts later for risk awareness
- Expansion signals should remain reviewable CRM records, not auto-actions, until a later phase adds prompting and outreach workflows

Verification:

- focused alert/expansion tests passed
- `npx prisma validate` passed

Next:

- Phase 10 Stage 5: rep action prompt generation and activity-log integration on top of the new signals

## 2026-03-13 - Phase 10 Stage 5

Completed:

- Added `RepActionPromptService` to generate reviewable rep prompts from both career-movement alerts and expansion-opportunity signals
- Integrated rep prompt creation into the career movement alert flow and the expansion opportunity flow
- Added audit logging for prompt creation so prompts are visible in CRM activity history as explicit system suggestions
- Added tests for prompt derivation, prompt persistence, and prompt creation from both alert and expansion paths

Assumptions:

- Rep prompts should remain suggestions only in this stage, never auto-send or auto-complete actions
- Title changes are best handled as congratulations prompts, while company changes become reconnect or introduction prompts depending on champion/priority context
- Expansion opportunity signals should automatically yield a rep prompt because otherwise the signal risks becoming passive data

Verification:

- focused prompt-generation tests passed
- `npm run lint` passed

Next:

- Phase 10 Stage 6: surface champion, watchlist, movement, expansion, and prompt intelligence in the CRM UI

## 2026-03-13 - Phase 10 Stage 6

Completed:

- Expanded the admin lead detail data loader to include relationship milestones, company associations, richer champion/watchlist records, expansion opportunity signals, and rep action prompts
- Upgraded the lead detail UI to surface:
  - richer champion and watchlist status
  - relationship timeline milestones
  - company associations
  - career movement alerts with suggested next steps
  - expansion opportunity signals
  - rep action prompts
- Added render coverage for the new relationship-intelligence sections on the lead detail page

Assumptions:

- The lead detail page is the right first surface for Phase 10 UI because it concentrates contact-level relationship intelligence where reps and admins already investigate context
- A separate alerts center or champions route can come later once the service-layer data has proven useful on detail pages
- Company/account detail routes remain a future extension because the current CRM still centers the relationship model around `Lead`

Verification:

- focused lead-detail UI tests passed
- `npm run lint` passed

Next:

- Phase 10 Stage 7: polish, docs, and final architecture wrap-up for the phase

## 2026-03-13 - Phase 10 Stage 7

Completed:

- Added dedicated documentation for champion tracking and career movement automation
- Updated company-intelligence and relationship-intelligence documentation with the final Phase 10 architecture state
- Recorded the final layering model for Phase 10 so future automation work can build on clear boundaries between facts, CRM relationship state, strategic interpretation, and rep suggestions
- Re-ran full verification after the documentation/polish pass

Assumptions:

- Phase 10 is complete as a relationship-intelligence foundation and does not need a separate route overhaul before future phases
- The current lead-detail-first UI is sufficient for validating the usefulness of relationship intelligence before broader dashboards or alerts-center work
- Follow-on phases can now focus on workflow acceleration, tasking, outreach drafting, and broader account intelligence on top of this foundation

Verification:

- `npm run test` passed
- `npm run lint` passed
- `npx prisma validate` passed

Next:

- Phase 11: optional workflow acceleration around tasks, reminders, outreach drafting, and rep execution flows

## 2026-03-13 - Phase 11 Stage 1

Completed:

- Extended Prisma with Phase 11 workflow-intelligence enums for outreach drafts, briefs, prioritization, and rep task suggestions
- Added new Stage 1 models for `OutreachDraft`, `DraftGenerationContext`, `AccountBrief`, `ContactBrief`, `BriefGenerationRun`, `PriorityScore`, `PriorityReason`, and `RepTaskSuggestion`
- Linked the new models back to existing `Lead`, `RepProfile`, `Meeting`, `User`, `CareerMovementAlert`, `ExpansionOpportunitySignal`, and `RepActionPrompt` records so later stages can stay service-driven
- Added Stage 1 validation coverage for outreach drafts, draft context, account/contact briefs, brief runs, priority scores, priority reasons, and task suggestions
- Added a Phase 11 Stage 1 migration SQL file for the new workflow-intelligence schema

Assumptions:

- `EmailDraft` remains the Phase 8 meeting-follow-up artifact, while `OutreachDraft` becomes the broader Phase 11 reviewable outreach layer
- Stage 1 is intentionally schema-first and validation-first; no generation or UI logic is introduced yet
- Migration SQL was authored manually after validating the Prisma schema because the local database was unavailable during migration diff generation

Verification:

- `npx prisma validate` passed
- `npx prisma generate` passed
- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 11 Stage 2: implement outreach draft generation services, storage, and lifecycle behavior

## 2026-03-13 - Phase 12 Stage 1

Completed:

- Installed the Phase 12 infrastructure package set for tables, query caching, queues, rate limiting, official integration SDKs, QR generation, email templating, MSW, observability, and OCR scaffolding
- Added a reusable `DataTable` foundation using `@tanstack/react-table`
- Added a shared React Query client and app-wide provider foundation
- Added a BullMQ-backed `QueueService` with centralized domain job names
- Added a reusable Upstash rate-limit wrapper with local fallback behavior for development
- Added centralized Google and Notion SDK client factories
- Added QR generation utilities plus a QR preview component
- Added a reusable email template service with a baseline outreach-draft template
- Added OCR and business-card parsing service scaffolds
- Added an observability service wrapper over Sentry
- Added MSW server setup and baseline external API handlers for integration-style tests

Assumptions:

- Stage 1 is infrastructure-first; existing routes and business flows are not fully migrated onto these new foundations until later Phase 12 stages
- Upstash rate limiting currently falls back locally unless the required environment variables are present
- Sentry is integrated as a centralized service boundary first, without full production instrumentation yet

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 2: implement reusable table infrastructure across existing CRM tables

## 2026-03-13 - Phase 12 Stage 2

Completed:

- Expanded the shared `DataTable` to support client-side sorting and pagination on top of `@tanstack/react-table`
- Migrated the admin leads table to shared column definitions plus the reusable table component
- Migrated the rep lead inbox table to the reusable table component while preserving Trainovations card and badge styling
- Added coverage for shared table sorting and pagination behavior

Assumptions:

- Stage 2 focuses on the highest-value current tables first instead of forcing card-based rep management onto a table abstraction prematurely
- Client-side sorting and pagination are sufficient for the current dataset sizes; server-driven table state can come later if list sizes grow

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 3: implement React Query architecture where interactive CRM surfaces benefit from cache-aware fetching and mutation invalidation

## 2026-03-13 - Phase 12 Stage 3

Completed:

- Added authenticated API routes for integration settings and the rep workspace lead inbox
- Added reusable React Query hooks for integration settings queries, integration mutations, and workspace lead loading
- Migrated the integrations page onto a query-driven client component with mutation invalidation after preference updates and disconnects
- Migrated the rep workspace lead inbox onto a query-driven client component with explicit loading and error states
- Added route tests and React Query client-surface tests for both new interactive flows

Assumptions:

- React Query should target interactive, mutation-heavy or refreshable CRM surfaces first rather than replacing server components everywhere
- Integration settings are the best initial mutation/invalidation surface, while the rep inbox is a useful read-heavy query surface

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 4: implement BullMQ queue abstraction and initial job types on top of the Stage 1 queue foundation

## 2026-03-13 - Phase 12 Stage 4

Completed:

- Added typed automation-to-queue mapping in `src/lib/queue/job-types.ts`
- Added a reusable `JobEnqueuer` that creates CRM `AutomationJob` records and enqueues matching BullMQ jobs
- Added a worker-registry scaffold so future processors can plug into queue names without changing producer contracts
- Updated `AutomationOrchestrator` so Zoom meeting completion now enqueues through the shared BullMQ producer layer instead of only writing database rows
- Added tests covering queue mapping, job enqueueing, and meeting-pipeline enqueue behavior

Assumptions:

- Stage 4 focuses on producers and job definitions first; worker execution can stay scaffolded until later phases need real processors
- The CRM database remains the audit trail through `AutomationJob`, while BullMQ becomes the async execution transport

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 5: implement reusable public route rate limiting with the Upstash-backed service layer

## 2026-03-13 - Phase 12 Stage 5

Completed:

- Switched the public lead submission endpoint onto the shared Upstash-aware rate-limit utility
- Added reusable rate-limit response header support so public endpoints can expose remaining quota data consistently
- Preserved the local in-memory fallback path when Upstash environment variables are not configured
- Expanded public lead route tests to cover shared limiter behavior and response headers

Assumptions:

- Public lead submission is the highest-value first application point for the shared rate-limit service
- Zoom webhooks should continue relying primarily on signature verification, so aggressive rate limiting is deferred unless real abuse patterns appear

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 6: standardize Google and Notion SDK usage through centralized service and factory layers

## 2026-03-13 - Phase 12 Stage 6

Completed:

- Refactored `GoogleAuthService` to use the shared `GoogleClientFactory` for auth URL generation, authorization-code exchange, and token refresh
- Upgraded `GmailService`, `GoogleCalendarService`, and `GoogleDriveService` to use factory-backed official SDK clients for real API operations
- Extended `NotionSyncService` to use the shared `NotionClientFactory` and added a client-backed workspace identity path
- Added test coverage for the standardized Google service wrappers and the Notion client-backed identity flow

Assumptions:

- Notion OAuth exchange remains intentionally light in this stage; the priority here is centralizing SDK-backed service access, not finishing a production-grade token exchange
- Official SDK client creation should stay in shared factories so later queue jobs and sync services can reuse the same auth boundary

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 7: standardize QR generation and email templating flows on top of the new package foundation

## 2026-03-13 - Phase 12 Stage 7

Completed:

- Added a real QR download route at `src/app/api/rep/[slug]/qr/route.ts` using the shared `QrCodeService`
- Surfaced QR preview and QR SVG download actions in the rep workspace so reps can quickly share their public landing page in person and at events
- Extended the meeting follow-up draft pipeline to render a React Email HTML preview through `EmailTemplateService`
- Stored draft preview metadata alongside generated meeting email drafts so later sending/review flows can reuse a stable rendered artifact
- Added tests for the QR route, workspace QR surface, and richer meeting-draft metadata

Assumptions:

- The rep workspace is the best first place to expose QR sharing because it already acts as the rep's operational home base
- Email HTML stays in generation metadata for now instead of introducing a second rendered-content storage model before send/review workflows require it

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 8: integrate MSW more deeply, add Sentry baseline observability hooks, and wire OCR scaffolding into future-facing workflows

## 2026-03-13 - Phase 12 Stage 8

Completed:

- Expanded the MSW handler set to cover Google Calendar, Notion identity, and Resend email requests in addition to the earlier Google OAuth token mock
- Added provider-handler tests so external API mocking is now verified as reusable infrastructure rather than a one-off smoke seam
- Added baseline Sentry bootstrapping through `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `sentry.client.config.ts`
- Extended `ObservabilityService` with integration-error and queue-job error helpers, then wired those into queue enqueue failures and OCR failure paths
- Added a protected business-card OCR parse route at `src/app/api/workspace/business-card/parse/route.ts`
- Upgraded `BusinessCardParsingService` to map OCR text into likely fields with confidence labels and wired the rep capture button into the OCR route for a future-safe workflow seam

Assumptions:

- OCR parsing should stay review-first and return lightweight field suggestions rather than pretending card extraction is fully reliable
- Baseline Sentry wiring should initialize only when DSNs are present so local development stays friction-light

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 Stage 9: polish, final documentation pass, and architecture wrap-up for the infrastructure phase

## 2026-03-13 - Phase 12 Stage 9

Completed:

- Updated `.env.example` so the infrastructure phase now exposes the key local and platform variables for auth URLs, Redis/BullMQ, Upstash, Resend, Sentry, and public app URLs
- Refreshed `README.md` to reflect the current project state through Phase 12 instead of the earlier MVP-only snapshot
- Completed the Phase 12 documentation wrap-up so the queue, observability, testing, QR/email, and OCR seams are documented as one coherent platform layer

Assumptions:

- Phase 12 closes as a platform-hardening phase, so the highest-value polish is documentation, environment clarity, and stable architectural boundaries rather than introducing another product-facing feature
- `npm run build` remains environment-sensitive because remote font fetching can fail in restricted contexts; lint and test continue to be the reliable local verification baseline here

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Phase 12 complete. Best next phase is workflow execution on top of this platform layer: reviewed sends, task execution, OCR-to-lead review, and queue-backed processors.

## 2026-03-13 - Workflow Execution Stage 1

Completed:

- Added `OutreachDraftService` to generate reviewable outreach drafts from lead, meeting, and career-movement context
- Added `RepTaskSuggestionService` to materialize actionable rep tasks from new-lead state, career alerts, and open rep prompts
- Extended admin lead-detail retrieval to include `outreachDrafts` and `repTaskSuggestions`
- Added admin server actions to:
  - generate outreach drafts
  - update outreach draft status
  - generate task suggestions
  - update task suggestion status
- Upgraded the admin lead-detail UI to surface outreach drafts and task suggestions as usable workflow blocks instead of dormant records
- Added service coverage for draft generation/status updates and task-suggestion generation/status updates

Assumptions:

- The smallest useful next step after Phase 12 is lead-level execution, not a whole new task management subsystem
- Drafts and task suggestions remain reviewable CRM artifacts; this stage does not auto-send outreach or auto-complete work
- The admin lead-detail surface is the best first place to expose these execution objects because it already concentrates contact, relationship, and meeting context

Verification:

- `npm run lint` passed
- `npm run test` passed

Next:

- Best follow-on slice is rep-facing execution: workspace task views, reviewed-send flows, and OCR-to-lead review/merge

## 2026-03-13 - Phase 13 Planning

Completed:

- Reviewed the current CRM against custom-CRM operational best practices
- Consolidated the major product and architecture findings into a dedicated Phase 13 roadmap
- Defined the best next additions for access control, account/opportunity structure, rep execution, routing, compliance, scale, and security
- Broke Phase 13 into staged delivery slices for implementation planning

Assumptions:

- The next major phase should focus on operational maturity rather than another isolated intelligence feature
- The current CRM foundation is strong enough that the highest-value next work is around ownership, execution, compliance, and scale
- A dedicated roadmap document is the best way to turn review findings into a concrete delivery plan

Verification:

- Phase 13 roadmap documented in [phase-13-operational-crm-roadmap.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/phase-13-operational-crm-roadmap.md)

Next:

- Phase 13 Stage 1: Scoped Access and Governance

## 2026-03-13 - Phase 13 Stage 1

Completed:

- Added manager-to-rep ownership on `RepProfile` so admin scope can be grounded in real assignment data
- Scoped admin dashboard, leads list, lead detail, activity timeline, and rep management queries by the authenticated admin user
- Enforced manager-limited access on admin lead-detail actions and rep updates
- Updated seed data so the seeded manager owns the seeded rep profiles
- Documented the new scoped admin behavior in the roles and permissions guide

Assumptions:

- The smallest useful governance slice is manager-to-rep scoping, not a full territory engine
- `super_admin` should remain unrestricted while `sales_manager` becomes scope-limited
- A missing scoped record should resolve as inaccessible rather than exposing partial data

Verification:

- Focused admin-service tests cover manager-scoped lead access and forbidden out-of-scope rep updates

Next:

- Phase 13 Stage 2: Account and Opportunity Core

## 2026-03-13 - Phase 13 Planning Update

Completed:

- Expanded the Phase 13 roadmap to include a real connected inbox, a multi-view CRM calendar, and a Notion-style rich editor as explicit product stages
- Added npm package recommendations for each planned surface so implementation can start from concrete library choices instead of abstract feature goals

Assumptions:

- Inbox, calendar, and editor experiences are sticky daily-use surfaces and should be planned explicitly rather than buried inside a generic execution stage
- The best-fit current package direction is:
  - inbox: `@nylas/connect` and `@nylas/react`
  - calendar: `@fullcalendar/react`
  - editor: `@blocknote/react`

Verification:

- Phase 13 roadmap updated with dedicated stages for inbox, calendar, and rich editing

Next:

- Phase 13 Stage 2: Account and Opportunity Core

## 2026-03-13 - Phase 13 Stage 2

Completed:

- Added first-class `Account`, `AccountContact`, and `Opportunity` Prisma models
- Linked accounts to rep ownership, linked contacts, and opportunities
- Extended admin metrics to include total accounts and open opportunities
- Added scoped admin service access for account and opportunity lists
- Added `/admin/accounts` and `/admin/opportunities` surfaces plus admin navigation entries
- Seeded sample accounts, primary account contacts, and pipeline opportunities for the local environment

Assumptions:

- The smallest useful account core is company ownership, linked contacts, and pipeline records before introducing deeper account-detail workflows
- Opportunity stage is sufficient for this slice without a second status field
- Account and opportunity admin pages can start as list surfaces before detailed edit views land later

Verification:

- `npx prisma generate` passed
- `npm test -- admin-service dashboard-overview authorization` passed
- Prisma migration applied successfully
- Local seed updated successfully

Next:

- Phase 13 Stage 4: Connected Inbox and Threading, or Phase 13 Stage 3: Routing, Dedupe, and Merge Operations depending on which operating surface you want to build next

## 2026-03-14 - Phase 13 Stage 4

Completed:

- Added first-class inbox data models for `EmailMailbox`, `EmailThread`, and `EmailMessage`
- Linked inbox threads to reps, leads, accounts, and opportunities so message activity can live inside CRM context
- Added a rep-facing `/workspace/inbox` surface with mailbox context, unread state, recent message previews, and linked CRM records
- Added a workspace inbox API route and React Query hook for rep-owned thread retrieval
- Seeded representative mailbox, thread, and message data for the local CRM environment
- Updated the rep workspace quick actions so inbox and lead-queue entry points are separated cleanly

Assumptions:

- The first useful inbox slice is CRM-linked thread visibility, not full provider OAuth and send/sync workflows
- Thread context should support lead, account, and opportunity linkage from the start so later provider integrations do not need a second data-model pass
- The rep workspace should expose both a general inbox and a dedicated lead queue because those are adjacent but not identical workflows

Verification:

- `npx prisma generate` passed
- `npm test -- workspace-service rep-inbox workspace-overview` passed
- Prisma migration applied successfully
- Local seed updated successfully after rerunning it once the migration completed

Next:

- Phase 13 Stage 5: Calendar Workspace, or Phase 13 Stage 3: Routing, Dedupe, and Merge Operations if you want to close the data-quality gap before more rep surfaces

## 2026-03-14 - Phase 13 Rep Alert Workspace

Completed:

- Added a rep-facing `/workspace/alerts` surface so relationship alerts resolve inside the CRM instead of through public-page anchors
- Added rep-scoped alert retrieval and rep-scoped alert status updates for `dismissed` and `resolved`
- Wired command-center alert tiles and quick actions to the new workspace alert queue
- Added focused API, service, and component coverage for the alert workspace flow

Assumptions:

- The smallest useful alert workspace is a scoped queue with lead context, suggested next steps, and lightweight status actions
- Reps should be able to clear or resolve alerts without needing the admin lead-detail panel

Verification:

- `npm test -- workspace-service workspace-overview rep-alerts api/workspace/alerts` passed

Next:

- Add rep-safe lead detail views so inbox threads and alerts can deep-link into rep-owned contact context instead of the admin surface

## 2026-03-14 - Phase 13 Rep Lead Detail Workspace

Completed:

- Added a rep-safe `/workspace/leads/[id]` route with lead profile, status actions, note capture, alert context, meeting context, and activity timeline
- Added rep-scoped lead detail and rep-scoped lead activity retrieval in the workspace service layer
- Added lead status update logging to the lead service so rep-driven status changes create CRM activity history
- Repointed rep inbox, alert queue, lead table, and command-center lead shortcuts into the new rep-owned detail surface

Assumptions:

- The smallest useful rep lead-detail slice is context plus lightweight execution, not the full admin intelligence surface
- Reps need notes and status changes first, with deeper draft and opportunity workflows able to layer on afterward

Verification:

- `npm test -- lead-service workspace-service rep-leads-table rep-inbox rep-alerts rep-lead-detail workspace-overview` passed

Next:

- Add richer rep execution on the detail surface, or move into the calendar workspace if you want scheduling and time-based workflow next

## 2026-03-14 - Phase 13 Admin Rep Invitation and Offboarding

Completed:

- Added admin-driven rep invitations with temporary-password provisioning and first-login password-change enforcement
- Added user lifecycle tracking fields for invite sent, invite accepted, and last login timestamps
- Added admin rep-management controls to send invites, resend invites, monitor invite/login state, and offboard reps with reassignment
- Added safe offboarding logic so owned leads, accounts, opportunities, and related rep-owned records can be reassigned before the rep account is deleted
- Added a dedicated `/change-password` flow for invited users who must replace their temporary password on first login

Assumptions:

- The first useful invitation flow is credentials-based onboarding with an emailed temporary password
- Account deletion should remove the rep login after reassignment rather than leaving a dormant login behind
- Resending an invite should rotate the temporary password and reset the first-login password-change requirement

Verification:

- `npx prisma generate` passed
- `npm test -- admin-service login-form auth/schema lead-service` passed
- Prisma migration applied successfully

Next:

- Add richer admin feedback around invite delivery success/failure, or move back to rep execution and calendar workflows depending on which operating surface you want to deepen next

## 2026-03-14 - Phase 14 Stage 1

Completed:

- Added a new Phase 14 roadmap focused on rep execution and scheduling
- Added a rep-facing `/workspace/calendar` surface with day, week, month, and agenda-style views
- Combined synced calendar events and dated rep follow-up items into one calendar workspace feed
- Added recent meeting brief context alongside the calendar so reps can plan with current conversation context
- Added command-center entry points into the new calendar workspace

Assumptions:

- The first useful calendar slice is visibility and navigation, not full drag-and-drop scheduling
- Dated rep task suggestions should appear alongside synced events so the calendar reflects real CRM work instead of only provider data
- A server-rendered multi-view workspace is a better first slice than introducing a large calendar package before the execution model settles

Verification:

- `npm test -- workspace-service workspace-overview rep-calendar-workspace` passed

Next:

- Phase 14 Stage 2: Task-to-Calendar Workflow so reps can schedule and reschedule follow-up directly from CRM tasks

## 2026-03-15 - Phase 14 Stage 2

Completed:

- Added `scheduledAt`, `scheduledEndAt`, and `snoozedUntil` fields to the `RepTaskSuggestion` Prisma model
- Added `scheduleRepTask`, `unscheduleRepTask`, and `snoozeRepTask` service functions with rep-scoped ownership validation
- Updated `getRepCalendarWorkspace` to use `scheduledAt` for calendar item placement when set, with `recommendedDueAt` as fallback
- Updated `getRepCalendarWorkspace` to include tasks with an explicit `scheduledAt` in range even if `recommendedDueAt` differs
- Moved snooze filtering to an `AND` compound condition so the snoozed-task gate and the date-range OR coexist correctly
- Added `scheduleRepTaskAction`, `unscheduleRepTaskAction`, and `snoozeRepTaskAction` server actions with auth and input validation
- Updated `RepTaskCenter` with schedule, reschedule, and remove-schedule forms using `datetime-local` inputs
- Added snooze quick actions (tomorrow, 3 days, next week) to each task card
- Added overdue visual treatment to task cards with a destructive-tone border and badge for past-due items
- Updated `RepCalendarWorkspace` to show overdue badges on past task follow-up items
- Updated `RepCalendarWorkspace` to distinguish confirmed scheduled blocks from suggested follow-up with separate badge labels
- Added reschedule form inline on task follow-up items in the calendar workspace
- Updated the Stage 2 sidebar card to describe what this stage delivers
- Added service tests for `scheduleRepTask`, `unscheduleRepTask`, `snoozeRepTask`, and the snooze filter in `getRepCalendarWorkspace`
- Added component tests for overdue treatment, reschedule form, scheduled block labels, and Stage 2 sidebar content
- Updated `RepCalendarItem` interface to include `isScheduled` flag

Assumptions:

- A default scheduled block duration of 30 minutes is reasonable for most rep follow-up tasks
- Snooze presets (tomorrow at 9 AM, 3 days, next week) cover the most common rep snooze patterns without requiring custom date selection
- `scheduledAt` takes priority over `recommendedDueAt` when both are present on the same task

Verification:

- `npm test -- workspace-service rep-calendar-workspace` passed (22 tests)

Next:

- Phase 14 Stage 3: Inbox Execution so reps can reply, compose, and turn threads into timed work

## 2026-03-16 - Phase 14 Stage 4: Rep Accounts and Pipeline

Completed:

- Added `getRepAccountsWorkspace` service function — rep-scoped accounts with contacts, open deal count, and pipeline value totals
- Added `getRepOpportunitiesWorkspace` service function — rep-scoped opportunities sorted by target close date
- Added `moveRepOpportunityStage` and `updateRepOpportunityNextStep` service functions with rep ownership guards
- Created `/workspace/accounts` page with `RepAccountsWorkspace` component — account cards with primary contact, deal count badge, and pipeline value
- Created `/workspace/opportunities` page with `RepOpportunitiesWorkspace` component — stage-grouped pipeline view with summary metrics
- `RepOpportunitiesWorkspace` supports inline stage movement via form dropdown and inline next step editing
- Supports `?account=` filter query param for account-scoped pipeline view (linked from account cards)
- Added `moveOpportunityStageAction` and `updateOpportunityNextStepAction` server actions
- Added Accounts and Pipeline `ToolLinkTile` entries to the workspace overview nav

Assumptions:

- Rep-owned accounts and opportunities are scoped to `ownerRepProfileId` matching the session rep profile
- Pipeline stages are ordered: prospecting → discovery → demo → proposal → negotiation → closed_won / closed_lost
- Closed deals are shown in a separate section below open pipeline groups
- Next step description field is stored in the existing `Opportunity.description` column

Next:

- Phase 14 Stage 5: Rich Notes and Knowledge Capture — block-style editor for notes, briefs, and planning with slash commands and reusable templates

## 2026-03-16 - Phase 14 Stage 5: Rich Notes and Knowledge Capture

Completed:

- Added `NoteTemplateType` enum (`blank`, `meeting_notes`, `account_brief`, `follow_up_plan`) to Prisma schema
- Added `RepNote` model with optional context links to Lead, Account, and Opportunity
- Added `repNotes` relation to `RepProfile`, `Lead`, `Account`, and `Opportunity` models
- Created `note-service.ts` with `getRepNotes`, `createRepNote`, `updateRepNote`, `deleteRepNote` — all scoped to `repProfileId`
- Created `NoteEditorForm` client component with 4-template picker that pre-populates BlockNote editor with structured initial content
- Created `RepNotesWorkspace` list component with template type badge and context badges (lead/account/opportunity)
- Created `/workspace/notes` page with template picker, BlockNote editor, and saved notes list
- Created `createRepNoteAction` and `deleteRepNoteAction` server actions
- Added Notes `ToolLinkTile` to the workspace overview nav

Assumptions:

- Notes body is stored as BlockNote markdown lossy output (same pattern as the journal)
- Template initial content is applied client-side by replacing BlockNote document blocks
- Context links (lead/account/opportunity) are optional and set via hidden form inputs

Next:

- Phase 14 Stage 6: Saved Views and Workload Management

## 2026-03-16 - AI Proposal Generator

Completed:

- Added `ProposalStatus` enum and `Proposal` model to Prisma schema — stores all sections separately, optional links to lead/account/opportunity, share token for public view
- Added `proposals` relation to `RepProfile`, `Lead`, `Account`, and `Opportunity`
- Installed `@anthropic-ai/sdk` and created `src/lib/ai/client.ts` singleton
- Created `src/lib/ai/proposal-generator.ts` with:
  - `ProposalContext` type and CRM context assembler
  - `generateProposalWithAI()` — calls `claude-sonnet-4-6` with structured prompt, returns all 8 sections as JSON
  - `regenerateSectionWithAI()` — rewrites a single section with optional rep instruction
- Created `proposal-service.ts` — CRUD + `loadProposalContext()` which pulls rep, lead, account, opportunity, rep notes, and meeting summaries
- Created `POST /api/proposals/generate` — generates all sections from CRM context
- Created `POST /api/proposals/regenerate-section` — rewrites one section with optional instruction
- Created `ProposalEditor` client component — AI generate button, per-section textarea editors with inline AI rewrite + custom instruction, save-on-change, share link display
- Created `RepProposalsWorkspace` list component with status badges and AI indicator
- Created `/workspace/proposals` list page, `/workspace/proposals/new` create form, `/workspace/proposals/[id]` editor page
- Created `/proposal/[token]` public branded proposal view (print-friendly)
- Created server actions: `createProposalAction`, `saveProposalFieldAction`, `markProposalSentAction`, `updateProposalStatusAction`, `deleteProposalAction`
- Added Proposals `ToolLinkTile` to workspace overview nav
- Added `ANTHROPIC_API_KEY=""` to `.env.example`

Architecture notes:

- AI context assembly pulls from: rep signature profile, lead interest + company, account description + industry, opportunity value + close date + description, last 5 rep notes linked to the context, last 3 meeting summaries with call summaries
- Sections: Executive Summary, About Us, Scope of Work, Deliverables, Timeline, Pricing, Terms & Conditions, Next Steps
- Share token is generated on `markProposalSent` — public view at `/proposal/[token]` renders all non-empty sections
- Per-section AI rewrite accepts an optional natural-language instruction (e.g. "make it more concise")
