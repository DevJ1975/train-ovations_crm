# Stage 3 Public Rep Pages

## Route Added

- `/rep/[slug]`

## Public Data Flow

- Load landing page by slug
- Include rep profile, signature profile, and social links
- Shape that record for public use in [rep-landing.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/public/rep-landing.ts)
- Render through [rep-landing-page.tsx](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/public/rep-landing-page.tsx)

## Public Experience Includes

- Trainovations branding
- rep identity and photo
- rep bio
- call, email, website, and save-contact actions
- social links
- lead CTA placeholder for the upcoming modal
- branded footer
- custom not-found page

## Save Contact Integration

Stage 3 adds a public Save Contact integration point at:

- `/api/rep/[slug]/vcard`

This keeps the UI integration point stable for Stage 4, when contact export will be expanded.
