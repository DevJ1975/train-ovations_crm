# Stage 2 Data Architecture

## Models Added

- `RepProfile`
- `RepSignatureProfile`
- `RepSocialLink`
- `LandingPage`
- `Lead`
- `LeadNote`
- `ActivityLog`
- `OrganizationSettings`

## Relationship Summary

- `User` to `RepProfile` is one-to-one for sales reps
- `RepProfile` owns one signature profile, many social links, many landing pages, and many assigned leads
- `LandingPage` belongs to one rep profile and can collect many leads
- `Lead` can belong to a rep profile and landing page, can reference a duplicate parent lead, and can have many notes and activity entries
- `LeadNote` belongs to one lead and can optionally track the authoring user
- `ActivityLog` can be associated with a user actor, rep profile, and lead

## Service Layer

The Stage 2 services are intentionally route-agnostic and live in [src/lib/services](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/services).

Implemented functions:

- `createRepProfile`
- `updateRepProfile`
- `getRepProfileBySlug`
- `createLandingPage`
- `getLandingPageBySlug`
- `createLead`
- `findPotentialDuplicateLead`
- `createLeadNote`
- `createActivityLogEntry`

## Validation Layer

Zod schemas live in [crm.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/validation/crm.ts) and cover create/update flows for reps, signatures, social links, landing pages, leads, and lead notes.
