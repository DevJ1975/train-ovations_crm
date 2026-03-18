# Stage 7 Integrations Foundation

## Objective

Stage 7 establishes the provider architecture needed to connect Trainovations CRM to Google, Zoom, and Notion without making those tools the source of truth.

## Provider Architecture

- `ConnectedAccount` stores provider identity, scopes, token metadata, connection status, sync flags, and last sync timestamps.
- The CRM database remains the system of record for reps, leads, meetings, summaries, and sync history.
- Provider-specific services live in `src/lib/integrations` so routes and UI stay thin.

## Google Strategy

- Google Sign-In is available alongside credentials auth for Trainovations users.
- Basic sign-in uses only `openid email profile`.
- Workspace data access is requested separately with incremental authorization.
- Supported Google connection targets:
  - Gmail
  - Google Calendar
  - Google Drive

This prevents over-scoping the first login and keeps later permissions upgrades modular.

## Zoom Strategy

- Zoom OAuth connection scaffolding is available.
- Incoming webhook requests are verified and logged to `WebhookEvent`.
- `meeting.ended` events can attach to CRM `Meeting` records and queue downstream automation jobs.
- Automation jobs are intentionally queued, not executed inline, so later AI or sync workers can pick them up cleanly.

## Notion Strategy

- Notion is modeled as a connected system, not the primary note store.
- `NotionSyncRecord` tracks where CRM-originated notes or summaries were synced.
- A note destination abstraction supports:
  - Notion page
  - Notion database
  - CRM note

## Future Meeting Intelligence Flow

The current foundation is designed so a completed Zoom meeting can later trigger:

1. Zoom webhook ingestion
2. CRM `Meeting` lookup
3. `AutomationJob` queue creation
4. call summary generation
5. action item extraction
6. CRM note creation
7. follow-up calendar event creation
8. optional Notion sync

## Current UI Surface

- `/settings/integrations`

This page allows authenticated CRM users to:

- connect or disconnect providers
- inspect connection status
- view granted scopes at a basic level
- enable or disable sync and automation flags

## Implementation Notes

- Google Workspace OAuth, Zoom OAuth, and Notion OAuth are scaffolded for future real credential exchange.
- Notion callback handling is currently an MVP scaffold and should be upgraded to a real token exchange before production use.
- Token refresh handling is implemented at the service layer for Google and can be extended per provider later.
