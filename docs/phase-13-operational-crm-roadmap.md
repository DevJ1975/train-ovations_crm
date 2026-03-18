# Phase 13 Operational CRM Roadmap

## Findings

### 1. Access control is still role-based, not scope-based

Today the CRM distinguishes `super_admin`, `sales_manager`, and `sales_rep`, but admin access is still broadly granted at the route level.

Why this matters:

- managers will eventually need team or territory scoping
- future customer, region, or business-unit separation will require more than a binary admin gate
- data-leak risk grows quickly once more than one manager or team exists

References:

- [roles-and-permissions.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/roles-and-permissions.md)
- [server.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/auth/server.ts)
- [admin-service.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/services/admin-service.ts)

### 2. Sensitive integration and meeting data needs stronger governance

Connected account tokens, provider payloads, and meeting artifacts are foundational for automation, but they also expand the CRM's security and privacy footprint.

Why this matters:

- OAuth tokens should not remain casually accessible at the application layer
- transcripts, meeting payloads, and OCR artifacts need retention and redaction rules
- observability should capture failures without becoming a second storage layer for sensitive content

References:

- [observability.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/observability.md)
- [schema.prisma](/Users/jamiljones/trainovations_CRM/train-ovations_crm/prisma/schema.prisma)
- [connected-account-service.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/integrations/connected-account-service.ts)

### 3. The CRM is still lead-centric instead of account- and opportunity-centric

The current model captures rich lead, relationship, and signal data, but it still lacks a first-class account master and opportunity pipeline.

Why this matters:

- reps need account-level ownership and history
- managers need revenue pipeline, stage, value, and forecast views
- multi-contact buying committees are difficult when `Lead` remains the core identity anchor

References:

- [build-log.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/build-log.md)
- [opportunity-prioritization.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/opportunity-prioritization.md)
- [schema.prisma](/Users/jamiljones/trainovations_CRM/train-ovations_crm/prisma/schema.prisma)

### 4. Duplicate handling and inbound routing are still MVP-light

Current duplicate detection is intentionally lightweight and public lead routing is direct to the landing-page owner.

Why this matters:

- duplicates often happen across reps, domains, companies, and changed emails
- OCR capture needs a review-and-merge path, not just extraction
- production CRM behavior usually needs routing rules, ownership reassignment, and merge tooling

References:

- [stage-5-lead-capture.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-5-lead-capture.md)
- [lead-service.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/services/lead-service.ts)
- [build-log.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/build-log.md)

### 5. Rep execution is not yet the center of gravity

The CRM can generate task suggestions and outreach drafts, but those workflows still lean toward the admin detail view instead of the rep's daily workspace.

Why this matters:

- reps work from inboxes, task lists, and due dates
- suggested work needs acknowledgement, snooze, convert, complete, and reviewed-send flows
- OCR-to-lead review belongs close to the rep workspace, not just in admin context

References:

- [build-log.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/build-log.md)
- [workspace-overview.tsx](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/workspace/workspace-overview.tsx)
- [rep-leads-table.tsx](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/workspace/rep-leads-table.tsx)
- [lead-detail-panel.tsx](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/admin/lead-detail-panel.tsx)

### 6. Scale-oriented CRM patterns are still pending

The current interfaces are strong for seeded and early data, but several list and search surfaces still operate as small-data views.

Why this matters:

- lead tables should move toward server-side pagination and filtering
- search should become broader and faster than simple list filtering
- reporting, saved views, and workload management become harder if every list stays in-memory

References:

- [stage-6-admin.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-6-admin.md)
- [admin-service.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/services/admin-service.ts)
- [data-table.tsx](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/data-table/data-table.tsx)

### 7. Communication compliance is only partially modeled

The lead model enforces consent for inbound capture, but that is not the same as a production-ready outbound communication model.

Why this matters:

- email send workflows need preferences, suppression, and unsubscribe handling
- reviewed drafts are not the same thing as delivered communications
- legal basis and communication history need to be explicit before broader automation expands

References:

- [stage-5-lead-capture.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/stage-5-lead-capture.md)
- [email-automation.md](/Users/jamiljones/trainovations_CRM/train-ovations_crm/docs/email-automation.md)
- [crm.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/validation/crm.ts)

## Best Next Additions

### 1. First-class account and opportunity objects

Add:

- `Account`
- `Contact` or a clearer contact abstraction beyond `Lead`
- `Opportunity`
- ownership, stage, forecast, amount, target close date, and pipeline reporting

### 2. Scoped RBAC and ownership models

Add:

- team or territory membership
- manager-to-rep visibility rules
- scoped admin queries and actions
- explicit ownership transfer history

### 3. Rep execution center

Add:

- task inbox with due dates and SLA indicators
- reviewed-send workflow for outreach
- OCR-to-lead review, duplicate review, and merge actions
- one-click progression from suggestion to completed work

### 4. Connected inbox and account linking

Add:

- a real inbox experience instead of `mailto:` actions
- provider account linking for Gmail, Outlook, and other supported mail accounts
- CRM-linked threads on leads, contacts, accounts, and opportunities
- thread ownership, thread search, and message activity history

Recommended npm direction:

- `@nylas/connect`
- `@nylas/react`

Alternative lower-level path:

- `imapflow`
- `mailparser`

### 5. Calendar workspace and scheduling views

Add:

- day, week, month, and agenda/list calendar views
- lead-, rep-, and account-linked calendar events
- meeting and follow-up scheduling from CRM context
- drag-and-drop workflow for rescheduling and follow-up planning

Recommended npm direction:

- `@fullcalendar/react`

Alternative lighter path:

- `@schedule-x/react`

### 6. Rich editor and structured note-taking

Add:

- block-based notes and briefs
- slash commands and keyboard-first authoring
- reusable content blocks for call notes, account briefs, and outreach prep
- structured JSON storage for long-term editing flexibility

Recommended npm direction:

- `@blocknote/react`

Alternative power-user path:

- `@tiptap/react`

### 7. Data quality and routing operations

Add:

- merge queue
- reassignment and routing rules
- import and export tools
- fuzzy duplicate review
- domain and company-level matching strategies

### 8. Communication compliance and channel history

Add:

- unsubscribe and suppression tracking
- channel-level preferences
- send, delivery, bounce, and reply history
- do-not-contact controls

### 9. Security and retention controls

Add:

- encryption for tokens and other high-risk secrets
- retention windows for raw integration payloads
- transcript and OCR artifact access policy
- audit visibility for privileged actions

### 10. Search, reporting, and manager operations

Add:

- server-side pagination and filtering
- global search
- saved views
- manager dashboards for workload, follow-up SLA, and pipeline health

## Phase 13 Recommendation

Phase 13 should focus on turning the CRM from a strong intelligence foundation into an operational system that reps and managers can trust daily.

Suggested phase title:

- Phase 13: Operational CRM Maturity

## Phase 13 Stages

### Stage 1. Scoped Access and Governance

Deliver:

- team and territory ownership model
- scoped admin visibility for managers
- audit logging for privileged updates
- baseline data-retention and secret-handling rules

Outcome:

- the CRM becomes safer to scale across more users and teams

### Stage 2. Account and Opportunity Core

Deliver:

- account master model
- opportunity model with pipeline stages and value
- contact-to-account relationships
- account ownership and account-level activity summaries

Outcome:

- the CRM gains a true revenue pipeline instead of a lead-only workflow

### Stage 3. Routing, Dedupe, and Merge Operations

Deliver:

- configurable lead assignment rules
- duplicate review queue
- fuzzy matching and domain-aware matching
- merge and reassignment workflows
- OCR review into create, attach, or merge paths

Outcome:

- inbound data quality becomes operational instead of manual cleanup

### Stage 4. Connected Inbox and Threading

Deliver:

- linked inbox account connection flows
- CRM message thread model and message activity history
- lead, contact, account, and opportunity thread linking
- inbox list, thread view, and ownership-aware filtering

Recommended package direction:

- `@nylas/connect`
- `@nylas/react`

Outcome:

- reps gain a real CRM inbox instead of leaving the product for email execution

### Stage 5. Calendar Workspace

Deliver:

- day, week, month, and list calendar views
- CRM-linked events for leads, accounts, opportunities, and meetings
- follow-up scheduling from CRM workflows
- drag-and-drop or direct edit rescheduling support

Recommended package direction:

- `@fullcalendar/react`

Outcome:

- scheduling becomes part of the CRM operating surface instead of a disconnected provider tool

### Stage 6. Rich Editor and Knowledge Capture

Deliver:

- Notion-style block editor for notes, briefs, and planning
- slash commands and keyboard shortcuts
- reusable templates for meeting notes, account briefs, and outreach prep
- structured JSON-backed content storage

Recommended package direction:

- `@blocknote/react`

Outcome:

- CRM writing workflows become faster, more structured, and easier to reuse across reps

### Stage 7. Rep Execution Workspace

Deliver:

- rep task center
- due dates, reminders, and acknowledgement states
- reviewed-send actions for outreach drafts
- workspace surfacing for task suggestions, prompts, and meeting follow-up work

Outcome:

- reps can execute from one surface instead of switching between admin detail and inbox views

### Stage 8. Communication Compliance and History

Deliver:

- unsubscribe and suppression model
- channel preferences
- outbound send logging
- delivery, bounce, and reply tracking
- communication history on lead and future account records

Outcome:

- outreach workflows become trustworthy, auditable, and safer to expand

### Stage 9. Search, Views, and Reporting

Deliver:

- server-side pagination and filtering
- saved lead and opportunity views
- manager workload dashboards
- pipeline and follow-up reporting
- search across leads, accounts, meetings, and tasks

Outcome:

- managers and reps can operate at larger volume without the UI slowing down or losing clarity

### Stage 10. Security and Operational Hardening

Deliver:

- encrypted token handling
- raw payload retention controls
- artifact access policies
- queue-backed OCR and heavy automation processing
- operational runbooks for failures, retries, and support workflows

Outcome:

- the CRM becomes much safer and more supportable as automation usage grows

## Recommended Order

If Phase 13 must be split by business value, the best sequence is:

1. Stage 1: Scoped Access and Governance
2. Stage 2: Account and Opportunity Core
3. Stage 4: Connected Inbox and Threading
4. Stage 5: Calendar Workspace
5. Stage 6: Rich Editor and Knowledge Capture
6. Stage 7: Rep Execution Workspace
7. Stage 3: Routing, Dedupe, and Merge Operations
8. Stage 8: Communication Compliance and History
9. Stage 9: Search, Views, and Reporting
10. Stage 10: Security and Operational Hardening

Reasoning:

- access control should be corrected before the user base expands
- account and opportunity structure should exist before reporting grows deeper
- inbox, calendar, and editing are daily-use surfaces that increase CRM stickiness quickly
- reps need execution tooling early so the CRM becomes habit-forming
- routing, compliance, and scale work become easier once the core operating model is clear
