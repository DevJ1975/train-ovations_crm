# Queue Architecture

## Objective

BullMQ is the Phase 12 queue foundation for background work that should not run inline inside routes or UI actions.

## Stage 1 Status

Stage 1 adds a centralized `QueueService` with domain job names for:

- meeting processing
- Notion sync
- enrichment refresh
- email draft generation
- OCR processing

## Boundary Rules

- routes and services should enqueue work, not implement worker logic inline
- queue names are centralized so job producers and workers stay consistent
- Redis connection details remain environment-driven

## Local Assumptions

- local worker execution is not required in Stage 1
- `REDIS_URL` is preferred when available
- `REDIS_HOST` and `REDIS_PORT` are the local fallback connection inputs

## Stage 4 Update

Stage 4 turns the queue foundation into a real producer layer.

Added:

- `AUTOMATION_QUEUE_JOB_MAP` to map CRM automation job types onto BullMQ queues
- `JobEnqueuer` to create auditable `AutomationJob` records and enqueue the corresponding BullMQ jobs
- `worker-registry` scaffolding so processors can be attached by queue name later without changing producers

Current boundary:

- producers create durable CRM job records first
- BullMQ receives execution jobs second
- worker implementations remain intentionally light until later stages need real processing loops

## Phase 12 Wrap-Up

Queue architecture is now ready for the next layer of real workers.

Current strengths:

- typed job naming and queue naming
- centralized enqueueing
- durable CRM-side `AutomationJob` records
- observability hooks for enqueue failures
- OCR, meeting, enrichment, and sync domains already represented

Recommended next step:

- add domain workers and retry/backoff policies once the next product phase needs real background execution
