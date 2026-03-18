# Opportunity Prioritization

## Objective

Phase 11 introduces a reviewable prioritization layer so reps can understand what deserves attention first and why.

## Stage 1 Status

Stage 1 adds the core schema for:

- `PriorityScore`
- `PriorityReason`
- `RepTaskSuggestion`

## Explanation Layer

The prioritization system is designed to avoid black-box scoring.

Each priority record can include:

- a numeric score
- a priority band
- explanation text
- reason-summary text
- explicit reason-code records
- source confidence

## Future Stages

Later Phase 11 stages can evaluate:

- recent meetings without follow-up
- champion presence
- strategic-account movement
- stale but previously engaged leads
- confidence-aware urgency

Task suggestions are stored separately so prioritization does not automatically become execution.
