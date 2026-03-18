# Relationship Intelligence

## Objective

Phase 10 turns profile-linking and employment history into a relationship-intelligence layer that helps reps act on career movement and contact context instead of just storing snapshots.

## Stage 1 Scope

Stage 1 establishes the data architecture for:

- champion lifecycle tracking
- watchlist categorization and notification preferences
- relationship milestones
- contact-company associations
- expansion opportunity signals
- rep action prompts
- lightweight relationship edges

## Stage 2 Status

Stage 2 turns champion tracking and watchlists into real service-layer workflows:

- `ChampionTrackingService` applies lifecycle defaults and records audit events
- `ContactWatchlistService` persists strategic monitoring preferences and watchlist activation milestones
- existing admin update flows now call these dedicated services instead of writing directly through a generic relationship utility

This keeps the business rules in one place before deeper relationship-history and movement automation stages arrive.

## Stage 3 Status

Stage 3 adds the first dedicated relationship-memory services:

- `RelationshipHistoryService` syncs employment snapshots into current and historical relationship records
- current-employer company associations are normalized so later automation can reason about destination accounts
- milestone creation and timeline retrieval now have a dedicated home
- `RelationshipGraphService` can return lead-level relationship context and rep-level known-contact/company context without requiring a separate graph database

This is intentionally lightweight. The goal is queryable relationship intelligence using relational models first.

## Stage 4 Status

Stage 4 turns relationship changes into strategic signals:

- career movement alerts now carry suggested next steps and auditable alert-creation events
- strategic or target-company moves can create `ExpansionOpportunitySignal` records
- the employment-change pipeline can now emit both operational alerts and account-expansion/re-entry signals

This keeps alerts and expansion opportunities separate:

- alerts answer "what changed?"
- expansion signals answer "why might this matter commercially?"

## Stage 5 Status

Stage 5 adds reviewable rep-action suggestions:

- `RepActionPromptService` generates prompts from movement alerts and expansion signals
- prompts are stored as first-class CRM records, not ephemeral UI-only hints
- prompt creation is logged so teams can audit when the system suggested a next step

Prompt philosophy:

- suggestions are explicit and reviewable
- nothing is auto-sent
- prompt types stay grounded in business context such as congratulating a promotion, reconnecting after a move, or acting on an account-entry opportunity

## Stage 6 Status

Stage 6 brings the relationship-intelligence layer into the CRM UI:

- champion and watchlist state is shown with richer context
- relationship milestones and company associations are visible on lead detail
- career movement alerts now surface suggested next steps
- expansion opportunity signals and rep action prompts are visible as first-class CRM context

The UI goal is not to show every record blindly. It is to help a rep or admin answer:

- what changed?
- why does it matter?
- what should we do next?

## Modeling Principles

- The CRM remains the system of record.
- Confirmed facts, source-derived records, and AI-generated suggestions must remain distinguishable.
- Confidence scores and timestamps should travel with relationship records whenever the data is not purely user-authored.
- Relational models come first; the relationship graph is represented through typed association tables rather than a dedicated graph database.

## Key Models

- `ChampionFlag`
  Tracks whether a contact is a champion, who owns that relationship, the lifecycle status, priority, and supporting notes.

- `ContactWatchlist`
  Tracks whether a contact should trigger heightened monitoring and which types of changes matter.

- `RelationshipHistory`
  Stores current and historical company/title context, now with rep and profile-link association plus record origin.

- `RelationshipMilestone`
  Captures notable timeline events such as meetings, promotions, employment changes, and manual relationship notes.

- `ContactCompanyAssociation`
  Normalizes how a contact relates to a company across current employer, prior employer, client, prospect, target, and strategic contexts.

- `ExpansionOpportunitySignal`
  Stores relationship-driven opportunities such as re-entry, expansion, warm introductions, and named-account movement.

- `RepActionPrompt`
  Stores reviewable rep suggestions, such as reconnecting, congratulating a promotion, or reopening a prior conversation.

- `RelationshipEdge`
  Supports lightweight graph-like queries such as rep-to-contact, contact-to-company, and company-transition associations.

## Provenance Rules

- `originType` distinguishes `system_generated`, `user_input`, `external_source`, and `ai_generated` records.
- `sourceType` remains available where the underlying signal came from profile-linked or sourced external data.
- `confidenceScore` defaults conservatively so later automations can be explicit when a suggestion is uncertain.

## Future Automation Hooks

Later Phase 10 stages can use this foundation to:

- generate champion-loss and expansion alerts
- score destination companies for strategic importance
- create rep prompts from promotions or employer changes
- attach relationship context to outreach drafts and follow-up tasks

## Final Architecture Summary

Phase 10 is organized into five layers:

1. Source-backed relationship facts
   `LinkedInProfileLink`, `EmploymentSnapshot`, `EmploymentChangeEvent`, `RelationshipHistory`, and `ContactCompanyAssociation`

2. Relationship state
   `ChampionFlag` and `ContactWatchlist`

3. Strategic interpretation
   `CareerMovementAlert` and `ExpansionOpportunitySignal`

4. Reviewable action suggestions
   `RepActionPrompt`

5. Presentation
   lead-detail UI sections and activity timeline context

This layering matters because it keeps Trainovations from blending:

- sourced facts
- CRM-owned relationship memory
- system-generated suggestions

into one undifferentiated record.

That separation is what makes the relationship-intelligence system auditable, extendable, and safe for future automation.
