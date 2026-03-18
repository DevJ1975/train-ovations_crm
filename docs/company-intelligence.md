# Company Intelligence

## Phase 8 Direction

Trainovations CRM will use meeting intelligence to improve company context without treating AI output as verified account truth.

Principles:

- CRM remains the system of record
- verified meeting metadata stays separate from AI-generated interpretation
- company-level insights should be refreshable and auditable
- uncertain inferences should never overwrite user-authored account data

## Stage 1 Status

Phase 8 Stage 1 introduces the data architecture needed for future company intelligence:

- meetings linked to leads and reps
- source-backed artifacts like transcripts and recordings
- AI summary storage with provenance metadata
- structured action items and follow-up drafts

Future stages can use this foundation to derive account-level trends without collapsing raw evidence and generated interpretation into the same model.

## Phase 9 Direction

Phase 9 extends company intelligence by tracking where contacts work over time without pretending the CRM has perfect external visibility.

New company-intelligence building blocks:

- LinkedIn profile links with confidence and provenance
- employment snapshots with retrieval timestamps
- employment change events for title and company movement
- relationship history for current and prior employer context
- champion and watchlist flags for priority handling
- career movement alerts for operational follow-up

This keeps company intelligence grounded in auditable records:

- sourced identity links
- time-based employment snapshots
- explicit change detection
- human confirmation where confidence is not enough on its own

The company-intelligence layer can now support future workflows such as:

- champion movement playbooks
- re-engagement prompts after company changes
- account map updates when contacts depart
- enrichment-review queues for stale or broken profile links

## Phase 10 Stage 1 Direction

Phase 10 evolves those contact-movement records into relationship intelligence.

New Stage 1 building blocks:

- champion lifecycle state, priority, and owner metadata
- watchlist categories and richer notification preferences
- relationship milestones tied to contacts, reps, and prior company context
- contact-company associations for current, former, target, and strategic account context
- expansion opportunity signals for movement-based account re-entry or expansion
- rep action prompts as reviewable suggestions
- lightweight relationship edges for rep-to-contact and contact-to-company queries

Confidence and provenance rules:

- source-derived company history stays distinct from AI-generated suggestions
- strategic signals and prompts carry confidence metadata and origin labels
- relationship context remains auditable through timestamps and explicit source fields

This lets later phases answer questions like:

- which former champions moved recently?
- which contacts are now at strategic accounts?
- which reps already know a contact at their new company?
- which movement events should create follow-up prompts instead of passive alerts?

## Phase 10 Final State

By the end of Phase 10, company intelligence has moved from passive contact storage to relationship-aware commercial context.

The CRM can now surface:

- champion status and ownership
- relationship milestones
- current and historical company associations
- career movement alerts with suggested next steps
- expansion and re-entry opportunity signals
- reviewable rep prompts tied to relationship changes

This means company intelligence is no longer just "where does this person work?"

It becomes:

- what changed?
- why might this matter to Trainovations?
- who owns the relationship?
- what should the rep consider doing next?

## Phase 11 Stage 1 Direction

Phase 11 builds on that relationship intelligence so reps can move from "interesting signal" to "ready-to-use action context."

New workflow-intelligence building blocks:

- account briefs for account-level preparation
- contact briefs for contact-specific preparation
- priority scores and reason codes
- rep task suggestions tied to CRM signals
- outreach drafts with explicit source context and review state

The company-intelligence layer still stays grounded in:

- sourced employment and relationship facts
- explicit CRM activity history
- confidence labels on generated suggestions
- reviewable explanation text instead of opaque scoring

## Phase 12 Stage 1 Note

Phase 12 does not change company-intelligence rules directly, but it adds infrastructure needed for future scale:

- queue foundations for background enrichment and sync work
- official SDK client factories for Google and Notion integrations
- OCR scaffolding for future business-card capture and contact creation workflows
