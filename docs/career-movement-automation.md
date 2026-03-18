# Career Movement Automation

## Objective

Career movement automation turns employment changes into actionable CRM signals without overstating certainty or automating outreach blindly.

## Flow

1. Employment data is refreshed through sourced or confirmed profile context.
2. `EmploymentChangeDetectionService` compares the newest snapshot to the previous state.
3. Change events are created for meaningful differences.
4. `CareerMovementAlertService` creates operational alerts.
5. `ExpansionOpportunityService` evaluates whether the destination company creates a commercial opportunity.
6. `RepActionPromptService` turns the alert or expansion signal into a reviewable next-step suggestion.

## Data Layers

Confirmed or source-backed layers:

- `EmploymentSnapshot`
- `EmploymentChangeEvent`
- `RelationshipHistory`
- `ContactCompanyAssociation`

System-generated intelligence layers:

- `CareerMovementAlert`
- `ExpansionOpportunitySignal`
- `RepActionPrompt`

This separation is deliberate. A system suggestion should never overwrite the underlying relationship facts.

## Business Rules

Examples currently supported:

- champion company moves raise higher-priority movement alerts
- strategically relevant destination companies can generate expansion or re-entry signals
- company moves can produce reconnect or introduction prompts
- title changes can produce congratulations prompts

Examples intentionally deferred:

- auto-sending outreach
- auto-closing opportunities
- auto-reassigning ownership without review

## Confidence and Provenance

Career-movement automation uses:

- `confidenceScore`
- `originType`
- explicit activity logs

This allows the CRM to say:

- what changed
- what the system thinks might matter
- why the suggestion was created

without claiming more certainty than the data supports.

## Operational Principle

Trainovations CRM remains the system of record.

Automation records are reviewable CRM objects, not hidden background state.

## Future Extensions

- manager escalation for champion loss at customer accounts
- reminders and task generation from prompts
- account strategy note updates
- email draft generation from relationship signals
