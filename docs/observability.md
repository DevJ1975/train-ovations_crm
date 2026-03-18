# Observability

## Objective

Phase 12 starts a centralized observability layer so integration, automation, and route failures can be captured without scattering provider calls across the codebase.

## Stage 1 Status

Stage 1 adds:

- `ObservabilityService`
- a baseline Sentry package integration point
- documentation for future environment wiring

## Privacy Boundary

- avoid capturing sensitive lead content unless operationally necessary
- prefer contextual metadata over raw payload dumps
- keep the CRM as the system of record, not Sentry

## Future Extension

Later stages can wire this into:

- route handlers
- background workers
- integration failure paths
- automation orchestration

## Phase 12 Stage 8 Update

Stage 8 moves observability from a passive wrapper to a baseline platform seam.

Added:

- `instrumentation.ts` for Next.js runtime registration
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `sentry.client.config.ts`

Operational behavior:

- Sentry initializes only when the relevant DSN environment variables are present
- queue enqueue failures are captured through `ObservabilityService.captureJobError`
- OCR and related parsing failures are captured through `ObservabilityService.captureIntegrationError`

Environment notes:

- server: `SENTRY_DSN`
- client: `NEXT_PUBLIC_SENTRY_DSN`
- optional: `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- optional trace controls: `SENTRY_TRACES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
