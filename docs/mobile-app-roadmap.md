# Mobile App Roadmap

## Why This Matters

Reps will eventually need meeting summaries, follow-up drafts, and action items on mobile immediately after calls or in the field.

## Phase 8 Stage 1 Foundation

The new meeting-intelligence schema prepares mobile use cases by making the following entities first-class and independently retrievable:

- `Meeting`
- `MeetingArtifact`
- `MeetingParticipant`
- `CallSummary`
- `ActionItem`
- `EmailDraft`

This keeps future mobile clients from parsing raw webhook payloads or AI blobs directly.

## Later Mobile Opportunities

- rep-facing meeting recap screens
- action item checklists
- draft follow-up review flows
- push notifications for completed meeting processing
# Mobile App Roadmap

## Phase 12 Stage 1 Update

Phase 12 adds the first OCR/scanning foundation for future mobile workflows:

- `tesseract.js` via `OcrService`
- `BusinessCardParsingService` as the future-safe parsing boundary

This does not productize mobile scanning yet. It creates the service seam needed for later business-card capture, OCR review flows, and rep-friendly mobile ingestion without baking OCR logic into UI components.

## Phase 12 Stage 8 Update

Stage 8 turns that OCR foundation into a callable mobile-safe workflow seam:

- authenticated OCR parsing endpoint at `/api/workspace/business-card/parse`
- lightweight field extraction for name, company, email, and phone
- rep workspace capture button now hands captured images into the OCR route

This is still intentionally review-first:

- extracted fields are suggestions with confidence labels
- OCR failures are observable
- no automatic lead creation happens yet
