# Roles and Permissions

## Planned Roles

- `super_admin`
  Full system access, organization settings, rep management, and lead oversight.

- `sales_manager`
  Access to assigned teams, leads, reporting, and rep supervision workflows.

- `sales_rep`
  Access to personal profile, landing pages, and assigned leads.

## Stage 0 Status

Role documentation is defined here, but role enforcement is not implemented yet. Auth.js and route protection begin in Stage 1.

## Stage 1 Status

Implemented:

- Credentials-based authentication
- Session role mapping for `id`, `name`, `email`, and `role`
- Admin route protection for `super_admin` and `sales_manager`

Current access rules:

- `super_admin`
  Can access `/admin`

- `sales_manager`
  Can access `/admin`

- `sales_rep`
  Can sign in, but is redirected away from `/admin`

## Stage 7 Status

Implemented:

- Google Sign-In alongside credentials auth
- integration settings access for authenticated CRM users
- provider connection preference controls for sync and automation flags

Current integration access rules:

- `super_admin`
  Can connect providers and manage personal integration settings

- `sales_manager`
  Can connect providers and manage personal integration settings

- `sales_rep`
  Can connect providers and manage personal integration settings

## Phase 13 Stage 1 Status

Implemented:

- manager-to-rep ownership through scoped rep assignments
- scoped admin data access for `sales_manager`
- manager-limited lead, rep, and lead-detail visibility in admin surfaces
- scoped guardrails on rep updates and lead-detail actions

Current scoped admin rules:

- `super_admin`
  Can access all reps and all leads across the CRM.

- `sales_manager`
  Can access only reps explicitly assigned to them and only leads owned by those reps.

- `sales_rep`
  Continues to use the rep workspace and remains blocked from `/admin`.
