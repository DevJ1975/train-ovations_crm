# Stage 6 Admin Workspace

## Routes

- `/admin`
- `/admin/leads`
- `/admin/leads/[id]`
- `/admin/reps`

## Service Layer

Implemented admin-focused service functions:

- `getDashboardMetrics`
- `getLeadsList`
- `getLeadById`
- `getLeadActivityTimeline`
- `getRepProfiles`
- `updateRepProfileBasic`

## Admin UX

- Dashboard summary cards for lead volume, recent leads, ownership, and statuses
- Search and filtering on the leads list
- Lead detail workspace with source context, duplicate flag, notes, and activity timeline
- Rep management with basic editable profile fields, slug visibility, active status, and public page preview
