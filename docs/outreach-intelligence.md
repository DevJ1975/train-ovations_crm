# Outreach Intelligence

## Objective

Phase 11 turns CRM intelligence into rep-ready outreach context without auto-sending messages by default.

## Stage 1 Status

Stage 1 introduces the storage and validation layer for:

- `OutreachDraft`
- `DraftGenerationContext`
- review and approval state for generated drafts
- explicit source context and explanation metadata

## Design Rules

- drafts must remain reviewable
- source-backed facts stay separate from generated messaging
- low-confidence drafts should be labeled clearly
- generation context should explain why a draft exists, not just store the text

## Future Stages

Later Phase 11 stages will use this schema to generate:

- first follow-up drafts
- post-meeting follow-ups
- reconnect drafts for dormant leads
- congratulatory job-change outreach
- re-entry outreach when known contacts join strategic accounts

## Workflow Execution Stage 1 Update

The first execution layer now uses that Phase 11 schema for real CRM actions.

Implemented:

- `OutreachDraftService`
- lead-context draft generation for:
  - new lead follow-up
  - post-meeting follow-up
  - movement-based re-entry outreach
- review-state transitions for stored drafts
- admin lead-detail rendering for generated drafts

Boundary reminder:

- drafts are still review-first
- explanation text is preserved alongside the draft
- generation stays rules-based and source-aware instead of pretending unsupported claims are known facts
