# Testing Strategy

## Goals

The MVP should protect the highest-risk workflows first:

- authentication and authorization
- lead creation and duplicate handling
- rep profile data integrity
- vCard generation
- public landing page rendering

## Stage 0 Coverage

Initial coverage is intentionally lightweight:

- design token smoke test
- root page rendering test

## Stage 1 Coverage

Stage 1 adds tests for:

- role guard utilities
- login validation schema
- session role mapping
- protected-route outcome logic

## Planned Coverage by Stage

- Stage 1: auth guards and role access
- Stage 2: rep profile services and model validation
- Stage 3: public landing page rendering, social link display, slug lookup, and not-found behavior
- Stage 4: vCard formatting, endpoint responses, and invalid slug handling
- Stage 5: lead creation, duplicate detection, and form validation
- Stage 6: dashboard metrics, admin lead retrieval, lead detail data, rep management, and critical admin rendering
- Stage 7: connected-account lifecycle, token refresh handling, Zoom webhook verification and ingestion, and integration permission guards
- Phase 8 Stage 1: meeting-intelligence schema contracts, artifact availability handling, AI-output separation, and follow-up draft record validation
- Phase 8 Stage 2: meeting completion processing, Zoom webhook persistence behavior, participant mapping, and missing-artifact handling
- Phase 8 Stage 3: meeting-intelligence generation contracts, transcript-vs-metadata fallback behavior, persistence mapping for summaries/action items/drafts, and provider abstraction coverage
- Phase 8 Stage 4: meeting-specific CRM note creation, activity log provenance, and backward-compatible lead-note service behavior
- Phase 9: LinkedIn profile URL validation and normalization, confidence-based profile matching, employment change detection, alert priority creation, provenance handling, and linked-profile admin rendering
# Testing Strategy

## Phase 12 Stage 1 Update

The test harness now includes `msw` for external API mocking so integration-facing tests can avoid brittle manual fetch stubs.

Current baseline additions:

- shared MSW server bootstrapped from `src/test/setup.ts`
- centralized handlers in `src/test/msw/handlers.ts`
- a smoke test proving external Google token requests can be intercepted in Vitest

This foundation is intended to support later mocking for:

- Google APIs
- Zoom provider responses
- Notion sync responses
- email provider behavior
- future OCR-adjacent upload flows

## Phase 12 Stage 8 Update

Stage 8 extends the MSW coverage from a single token smoke test into reusable provider-level mocks.

Current handler coverage includes:

- Google OAuth token exchange
- Google Calendar list responses
- Notion identity responses
- Resend email send responses

Stage 8 also adds route and service coverage for:

- OCR parse route behavior
- business-card parsing heuristics
- queue enqueue observability
- richer observability helper metadata

## Workflow Execution Stage 1 Update

The workflow-execution slice adds service-heavy coverage for:

- outreach draft generation from lead context
- outreach draft lifecycle status updates
- rep task suggestion generation from new leads, movement alerts, and rep prompts
- rep task suggestion status updates
- admin lead-detail rendering for the new workflow sections
