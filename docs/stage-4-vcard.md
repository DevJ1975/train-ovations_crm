# Stage 4 Save Contact / vCard

## Route

- `/api/rep/[slug]/vcard`

## Implementation

- Public slug lookup uses [rep-landing.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/public/rep-landing.ts)
- vCard generation lives in [vcard.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/lib/public/vcard.ts)
- The route returns a downloadable `.vcf` file with contact-safe public fields only

## Included vCard Fields

- full name
- title
- company
- phone
- email
- website
- LinkedIn URL when available

## Notes

- `RepSignatureProfile` is treated as the primary public contact source when those fields exist
- Additional public links may be included as labeled URLs when they fit cleanly within the vCard output
