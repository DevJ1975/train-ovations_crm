# Phase 14 Rep Execution and Scheduling

## Goal

Phase 14 should turn the CRM from a strong rep workspace into a true daily operating system for time-based execution.

Phase title:

- Phase 14: Rep Execution and Scheduling

## Why This Phase Exists

Phase 13 closed major workflow gaps around rep tools, tasking, alerts, inbox visibility, lead detail, and admin lifecycle management. The next gap is not more records. It is better execution rhythm.

Reps still need a stronger way to:

- plan the day
- work time-based follow-up
- move between inbox, leads, tasks, and meetings without losing context
- manage account and opportunity work from rep-owned surfaces
- capture richer notes and reusable meeting context

## Phase 14 Stages

### Stage 1. Calendar Workspace Foundation

Deliver:

- rep-facing `/workspace/calendar`
- day, week, month, and agenda/list views
- unified visibility for synced calendar events and dated rep follow-up
- direct navigation into linked lead context and integrations

Outcome:

- time-based work becomes visible inside the CRM instead of living in disconnected tools

### Stage 2. Task-to-Calendar Workflow

Deliver:

- schedule-from-task actions
- due-date editing and rescheduling
- follow-up blocks created from rep task suggestions
- reminder and overdue treatment for dated execution

Outcome:

- task management and calendar planning stop behaving like separate systems

### Stage 3. Inbox Execution

Deliver:

- reply, compose, and send-ready thread actions
- create task or follow-up event from a thread
- relink thread ownership to lead, account, or opportunity
- better unread, awaiting-reply, and follow-up-needed states

Outcome:

- the inbox becomes a true CRM working surface instead of a viewer

### Stage 4. Rep Accounts and Pipeline

Deliver:

- `/workspace/accounts`
- `/workspace/opportunities`
- rep-scoped account summaries, contacts, and pipeline views
- pipeline stage movement and next-step editing from rep surfaces

Outcome:

- reps can work revenue and account strategy without bouncing into admin context

### Stage 5. Rich Notes and Knowledge Capture

Deliver:

- block-style editor for notes, briefs, and planning
- slash commands and keyboard-first authoring
- reusable note templates for meetings, account briefs, and follow-up plans
- structured storage for long-term editing flexibility

Recommended package direction:

- `@blocknote/react`

Alternative:

- `@tiptap/react`

Outcome:

- note-taking becomes faster, more reusable, and better suited to CRM knowledge work

### Stage 6. Saved Views and Workload Management

Deliver:

- saved task, lead, and pipeline views
- filters like `needs response today`, `overdue follow-up`, and `meetings this week`
- rep workload summaries
- manager-facing execution visibility for overdue and at-risk work

Outcome:

- reps and managers can operate at higher volume with less mental overhead

## Recommended Order

1. Stage 1: Calendar Workspace Foundation
2. Stage 2: Task-to-Calendar Workflow
3. Stage 3: Inbox Execution
4. Stage 4: Rep Accounts and Pipeline
5. Stage 5: Rich Notes and Knowledge Capture
6. Stage 6: Saved Views and Workload Management

Reasoning:

- calendar is the cleanest next layer on top of the task center and rep lead workspace
- scheduling and tasks should reinforce each other before inbox execution grows deeper
- inbox execution gets more valuable once reps can turn threads into timed work
- rep account and pipeline views land better after scheduling and follow-up habits exist
- rich writing and saved views become more useful once the core daily loop is in place

## Stage 1 Implementation Notes

This repository now starts Phase 14 with the first calendar slice:

- a rep-owned calendar workspace route
- multi-view navigation
- combined scheduled events and dated follow-up items
- recent meeting brief context in the same surface

This is intentionally the foundation slice, not the full scheduling system yet.
