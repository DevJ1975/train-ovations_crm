# Stage 5 Lead Capture

## Route

- `/api/public/leads`

## Public Experience

- A lead capture dialog is available from the public rep page
- The CTA can be opened manually and also appears after a short delay for QR/NFC traffic
- Submission stays lightweight and trust-first, without introducing campaigns or automation

## Data Flow

- Client form validates with Zod + React Hook Form
- Public route resolves rep and landing page metadata
- Service layer creates the lead, checks duplicates, assigns the rep, and writes an activity log
- Server-side rate limiting and honeypot protection screen obvious spam

## Fields

- first name
- last name
- company
- job title
- email
- phone
- industry
- interest
- notes
- consent

Hidden fields:

- rep slug
- landing page id
- submitted timestamp
- query parameters
- honeypot field
