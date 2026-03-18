# LinkedIn Identity And Career Movement

## Compliance Strategy

Phase 9 is intentionally designed to avoid unlawful scraping or brittle profile mining.

Current supported identity paths:

- manual LinkedIn profile URL attachment by a user
- confidence-based profile match suggestions that require human confirmation
- official LinkedIn-connected identity linking where a consenting source becomes available

Current unsupported paths:

- unconsented scraping
- hidden browser automation against LinkedIn
- treating guessed profile matches as verified identity

## Provenance Model

Every profile and employment record carries source metadata so the CRM can separate fact from suggestion.

Key provenance fields:

- `sourceType`
- `confidenceScore`
- `humanConfirmed`
- `lastCheckedAt`
- `retrievedAt`
- `externalProfileSourceId`

Supported source categories:

- `official_linkedin`
- `user_provided`
- `third_party_enrichment`
- `ai_inference`

This allows Trainovations CRM to:

- show users where identity data came from
- avoid overwriting CRM truth with low-confidence enrichment
- keep auditable timestamps for refresh and review flows

## Employment Change Detection Flow

The Phase 9 workflow is snapshot-based:

1. A profile link is attached or confirmed.
2. A new employment snapshot is stored with title, company, optional dates, and retrieval provenance.
3. The latest snapshot is compared with the prior snapshot.
4. The CRM creates `EmploymentChangeEvent` records when a meaningful change is detected.
5. The CRM creates `CareerMovementAlert` records based on the detected change and contact priority state.
6. Activity logs are written for profile linking, profile confirmation, snapshot refresh, and employment movement.

Detected changes currently include:

- title changed
- company changed
- departed prior employer
- stale profile data
- broken profile link

## Relationship And Champion Tracking

Phase 9 adds lightweight relationship memory around contact movement:

- `RelationshipHistory` tracks current and historical company relationships
- `ChampionFlag` marks high-value contacts
- `ContactWatchlist` increases alert priority for critical contacts

When a champion moves companies, the system raises a higher-priority alert and logs a dedicated champion-movement activity event.

## Future Extension Points

Planned safe extension paths:

- official LinkedIn consent-based member linking
- enrichment provider adapters behind the same provenance model
- admin queues for unresolved or broken profile links
- workflow actions triggered by champion movement alerts
- downstream automations that create tasks, reminders, or outreach drafts after movement is confirmed
