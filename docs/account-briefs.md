# Account Briefs

## Objective

Account briefs give reps a concise operational summary before outreach or meetings.

## Stage 1 Status

Phase 11 Stage 1 adds the data structures for:

- `AccountBrief`
- `ContactBrief`
- `BriefGenerationRun`

These records are designed to capture both the brief content and the generation metadata behind it.

## Brief Structure

The model supports concise sections such as:

- company overview
- key contacts
- champion context
- movement summary
- recent activity
- open action items
- recommended next step

## Review Model

- briefs are generated records, not system truth
- each brief can carry explanation text and confidence metadata
- generation runs remain auditable so future refreshes are traceable
