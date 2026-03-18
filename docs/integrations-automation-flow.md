# Integrations Automation Flow

## Phase 8 Flow

Target sequence for meeting-driven automation:

1. provider webhook arrives
2. meeting record is created or updated
3. available artifacts are linked or stored
4. automation jobs are queued
5. AI outputs are generated into structured CRM records
6. CRM notes, drafts, and optional downstream sync records are created

## Stage 1 Status

Stage 1 focuses only on the data architecture for that flow.

What exists now:

- automation job enums expanded for meeting notes, follow-up drafts, and Drive linking
- meeting entities can connect to leads, reps, calendar events, and sync targets
- downstream outputs have dedicated models instead of being embedded into webhook payloads

## Stage 2 Update

The Zoom webhook flow now persists the meeting-completion event before downstream AI work begins:

1. verify webhook
2. store webhook event
3. resolve meeting ownership and associations
4. upsert meeting record
5. persist participants and source-backed artifact availability
6. queue later automation jobs only after successful meeting persistence
