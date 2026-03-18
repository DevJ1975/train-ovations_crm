# Champion Tracking

## Objective

Champion tracking helps Trainovations preserve institutional relationship memory around the contacts who create internal momentum inside customer and target organizations.

## Model

Phase 10 uses `ChampionFlag` as the primary champion record.

Key fields:

- `leadId`
- `ownerRepProfileId`
- `isActive`
- `status`
- `priority`
- `rationale`
- `notes`
- `confidenceScore`
- `originType`
- `lastStatusChangedAt`

## Lifecycle

Supported lifecycle states:

- `active`
- `former`
- `at_risk`
- `moved`
- `lost`
- `archived`

Current service rule:

- if an active champion is deactivated without an explicit replacement status, the system defaults to `former`

This keeps relationship memory intact instead of collapsing the contact into a generic non-champion state.

## Ownership

Champion records can be assigned to a rep through `ownerRepProfileId`.

This allows Trainovations to answer:

- who owns this relationship?
- which rep should respond when the champion moves?
- which champions belong to a given rep portfolio?

## Auditability

Champion changes create:

- `champion_flag_updated` activity events
- relationship milestones when lifecycle state changes materially

This makes the CRM auditable and preserves context for future automation.

## Design Principles

- champion status is a CRM relationship record, not a scraped external fact
- provenance matters: user-entered champion knowledge should remain distinguishable from system-generated suggestions
- confidence should remain explicit when the system is inferring relationship strength from broader context

## Future Extensions

Potential next steps:

- champion portfolio views
- champion-loss manager notifications
- champion heatmaps by account
- outreach draft generation targeted at moved champions
