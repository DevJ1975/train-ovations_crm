# Trainovations CRM Design System

## Design Intent

The Trainovations CRM design language is meant to feel:

- Modern SaaS
- Industrial professional
- Technology-forward
- Enterprise credible

The system should communicate trust, operational maturity, and safety-minded technology rather than startup playfulness.

## Theme Strategy

All visual decisions should flow from centralized design tokens.

Primary implementation points:

- [design-tokens.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/theme/design-tokens.ts)
- [tailwind-theme.ts](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/theme/tailwind-theme.ts)
- [globals.css](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/app/globals.css)

## Token Categories

- Colors
- Spacing
- Typography
- Border radius
- Shadow styles

## Component Direction

Trainovations wrapper components live in [src/components/trainovations](/Users/jamiljones/trainovations_CRM/train-ovations_crm/src/components/trainovations).

Wrappers exist so that:

- shadcn-style primitives can be standardized behind Trainovations naming
- semantic variants can be reused consistently
- future design updates can happen in one place

## Layout Direction

Stage 0 establishes:

- background treatments
- semantic surfaces
- type scale
- standard button and card styling

Admin layouts and public rep landing pages will be built on top of this foundation in later stages.
