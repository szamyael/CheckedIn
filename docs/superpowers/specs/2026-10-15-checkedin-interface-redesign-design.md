# CheckedIn Interface Redesign

## Intent

Give CheckedIn a clearer, more modern campus-operations interface that makes
status, next actions, and live operational information easy to scan.

## Goals

- Establish one visual language across the web dashboards.
- Use the provided toolkit as visual reference without copying its unrelated
  product content.
- Improve dashboard hierarchy, navigation clarity, data density, and responsive
  behavior.
- Preserve all existing routes, permissions, workflows, and data behavior.
- Make the Org Member membership workflow feel like a first-class operational
  workspace.

## Non-goals

- No data model, API, authorization, or business-rule changes.
- No replacement of the existing icon library or chart library.
- No visual redesign of every student-facing flow in the first pass.
- No new dependency unless the current stack cannot express the design.

## Direction

Use the toolkit's strongest shared cues:

- Deep navy operational canvas with elevated navy cards.
- Periwinkle/blue primary actions and selected navigation.
- Mint for successful/active states.
- Orange for attention and pending states.
- Rounded cards with restrained borders and soft depth.
- Compact icon-led navigation rail with clear active state.
- High-contrast type hierarchy and compact metadata labels.

Use existing CSS variables and Tailwind utilities as the implementation seam.
Use the current Aptos/Segoe UI and serif display fallbacks unless the repository
already includes a local font asset suitable for web use; do not add remote font
loading for this pass.

## Scope

The first implementation pass covers:

1. Global dashboard tokens and component primitives.
2. Authenticated dashboard shell and navigation.
3. Shared page headers, statistics, sections, tables, and action controls.
4. Org Member dashboard and membership panel visual treatment.
5. Admin dashboard visual treatment where it uses shared primitives.

Existing behavior remains unchanged. The redesign is a visual and layout
change only.

## Acceptance

- Dashboard pages retain their current routes and server-side data.
- Keyboard focus remains visible and interactive controls retain semantic names.
- Mobile layouts remain usable without horizontal page overflow.
- Dark mode and existing theme settings remain functional.
- Web type-check, lint, build, and focused UI tests pass.
