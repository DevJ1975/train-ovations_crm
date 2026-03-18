# Infrastructure Packages

## Objective

Phase 12 introduces a focused package layer to improve scalability, testing, security, and developer ergonomics without changing the CRM as the system of record.

## Stage 1 Package Roles

### Data and server state

- `@tanstack/react-table`
  Used for the reusable `DataTable` foundation in `src/components/data-table`.
- `@tanstack/react-query`
  Used for the shared query client and app-wide provider in `src/lib/query` and `src/components/providers`.
  Stage 3 applies it to:
  - integration settings
  - rep workspace lead inbox

### Jobs and automation

- `bullmq`
  Used for the queue abstraction in `src/lib/queue/queue-service.ts`.

### Public endpoint protection

- `@upstash/ratelimit`
  Used in the new reusable rate-limit service scaffold in `src/lib/security/upstash-rate-limit.ts`.
  Stage 5 applies it to:
  - public lead submission

### Official integration SDKs

- `googleapis`
  Used by `GoogleClientFactory` for centralized Gmail, Calendar, and Drive client creation.
- `@notionhq/client`
  Used by `NotionClientFactory` for centralized Notion SDK access.
  Stage 6 applies these factories to:
  - Google OAuth and token refresh handling
  - Gmail label lookup
  - Calendar list access
  - Drive file listing
  - Notion workspace identity lookup

### QR generation

- `qrcode`
  Used for server-side QR asset generation.
- `react-qr-code`
  Used for in-app QR preview rendering.
  Stage 7 applies these tools to:
  - rep landing page QR preview in the workspace
  - server-generated QR SVG downloads for public rep links

### Email

- `resend`
  Used for the provider wrapper in `EmailTemplateService`.
- `@react-email/components`
  Used for reviewable email template rendering.
  Stage 7 applies these tools to:
  - HTML preview rendering for meeting follow-up drafts
  - future-safe provider abstraction for reviewed outreach sends

### Testing and observability

- `msw`
  Used in the shared Vitest setup for external API mocking.
- `@sentry/nextjs`
  Used by `ObservabilityService` for centralized error and message capture.

### OCR

- `tesseract.js`
  Used in `OcrService` as the future OCR/scanning foundation.

## Stage Boundaries

- Stage 1 adds package entry points and smoke-tested scaffolds.
- Later Phase 12 stages will migrate existing tables, route mutations, public endpoints, and automation flows onto these foundations.
- Stage 7 turns the QR and email foundations into real product-facing seams without yet auto-sending email or overbuilding QR management UI.

## Phase 12 Wrap-Up

By the end of Phase 12, these packages are no longer just installed:

- TanStack Table powers shared CRM table behavior
- React Query powers interactive settings and rep inbox refresh flows
- BullMQ defines the queue boundary for async automation work
- Upstash-backed rate limiting protects the public lead endpoint
- Google and Notion use centralized official SDK factories
- QR generation supports rep-facing preview and SVG download
- React Email and Resend support reviewable rendered email drafts
- MSW provides reusable provider-level mocks in tests
- Sentry is wired as a baseline observability seam
- Tesseract-backed OCR is exposed through a protected business-card parsing route

Boundary reminder:

- CRM records remain the source of truth
- packages stay behind service or infrastructure seams
- UI surfaces consume those seams rather than owning provider logic directly
