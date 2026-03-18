# Email Automation

## Phase 8 Direction

Email automation in Trainovations CRM starts with safe draft generation, not autonomous sending.

Principles:

- drafts are reviewable records in the CRM
- generated content must be marked as AI-assisted
- sending workflows should be optional and configurable
- Gmail remains a connected channel, not the source of truth

## Stage 1 Status

Phase 8 Stage 1 adds `EmailDraft` as the storage layer for:

- post-meeting follow-up drafts
- proposal-related drafts
- later review and approval workflows

Later stages will populate these drafts from meeting summaries, action items, rep signature data, and lead context.

## Stage 3 Update

Phase 8 Stage 3 now generates follow-up drafts from:

- meeting summary output
- extracted action items
- rep identity and signature context
- lead and company context when available

Drafts are created as reviewable CRM records and older draft versions for the same meeting are archived before a fresh draft is stored.

## Phase 11 Stage 1 Direction

Phase 11 broadens draft generation beyond meeting follow-up.

New Stage 1 workflow-intelligence records prepare the CRM for:

- first lead follow-up drafts
- reconnect and dormant-lead drafts
- congratulatory job-change outreach
- re-entry outreach when a known contact joins a strategic account
- proposal reminder drafts

Important distinction:

- `EmailDraft` remains the existing meeting-intelligence and channel-adjacent draft record
- `OutreachDraft` becomes the broader CRM workflow draft that can carry explanation text, source context, review state, and future edit history

The system still defaults to review-first behavior:

- drafts are stored, not auto-sent
- generation context remains inspectable
- low-context situations can be surfaced honestly instead of pretending the system knows more than it does

## Phase 12 Stage 1 Foundation

Phase 12 adds the package-level foundation for future email workflow standardization:

- `resend` for provider integration
- `@react-email/components` for reusable template composition
- `EmailTemplateService` as the centralized rendering/provider boundary

Stage 1 includes a baseline outreach-draft template so later phases can render reviewable draft previews without coupling CRM workflows directly to provider APIs.

## Phase 12 Stage 7 Integration

Phase 12 Stage 7 connects that package foundation to a real CRM workflow.

Meeting follow-up drafts now:

- render an HTML preview through `EmailTemplateService`
- preserve preview text and rendered HTML in generation metadata
- remain reviewable CRM draft records, not auto-sent messages

This keeps the architecture honest:

- `EmailDraft` remains the system-of-record draft artifact
- rendered HTML is a reusable preview asset, not proof that a message was delivered
- future Resend or Gmail send flows can consume the stored preview safely after human review
