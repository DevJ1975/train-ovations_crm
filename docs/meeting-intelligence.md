# Meeting Intelligence

## Objective

Phase 8 turns the Phase 7 integration foundation into an auditable meeting-intelligence system for sales workflows.

## Data Separation

Verified meeting facts:

- meeting title and timing
- lead and rep association
- participant records
- recording or transcript availability
- source-backed artifact metadata

AI-generated outputs:

- `CallSummary`
- `ActionItem`
- AI-generated `LeadNote`
- `EmailDraft`

This separation is intentional so the system can distinguish evidence from interpretation.

## Stage 1 Status

Stage 1 adds the schema and validation contracts for:

- richer `Meeting` records
- `MeetingParticipant`
- richer `MeetingArtifact`
- expanded `CallSummary`
- richer `ActionItem`
- `EmailDraft`
- richer `LeadNote` provenance
- richer `NotionSyncRecord` linkage

## Stage 2 Status

Stage 2 adds the first real meeting-processing workflow:

- Zoom `meeting.ended` events can now create or update CRM meeting records
- meetings can be linked to reps, leads, and calendar events when the source payload provides enough context
- source-backed artifacts are stored with explicit availability state
- missing transcripts or recordings are preserved as missing artifacts instead of being silently dropped

## Stage 3 Status

Stage 3 adds the first generated-intelligence layer:

- a provider-based `MeetingIntelligenceService`
- transcript-first evidence handling with metadata-only fallback
- generated `CallSummary` persistence
- generated `ActionItem` persistence
- generated follow-up `EmailDraft` persistence
- AI-labeled CRM note creation tied back to the meeting and summary

The current default provider is deterministic and intentionally labeled as such. It exists to validate the architecture and persistence flow without overstating model-backed intelligence.

## Stage 4 Status

Stage 4 turns generated outputs into explicit CRM records and audit events:

- AI-generated meeting notes are stored as `LeadNote` records with AI provenance
- meeting-note creation is logged separately from generic lead-note activity
- generated summaries and follow-up drafts create dedicated CRM activity entries
- audit metadata links those events back to the meeting, summary, and evidence source

## Auditability Requirements

- generated outputs retain timestamps
- provider or model metadata is stored when available
- source artifact linkage is preserved for summaries
- CRM notes can be labeled as user-authored, AI-generated, or system-generated

## Phase 11 Stage 1 Direction

Phase 11 extends meeting intelligence into rep-facing workflow preparation.

The new schema surface prepares the CRM to:

- turn meeting context into broader outreach drafts
- assemble account and contact brief panels that can include recent meetings
- score meeting-adjacent opportunities with explicit reason codes
- create reviewable task suggestions when a meeting happened but follow-up is still missing

Meeting evidence still stays separate from Phase 11 recommendation layers. A brief or draft can cite meeting context, but it does not replace the underlying meeting facts, transcript availability, or call-summary evidence.
