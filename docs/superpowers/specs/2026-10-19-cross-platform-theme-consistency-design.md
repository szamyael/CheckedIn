# Cross-Platform Theme Consistency Design

## Intent

Students, faculty, organization staff, and administrators should see a coherent
CheckedIn visual system in both light and dark mode on the web and mobile app.
Backgrounds, surfaces, borders, text, buttons, inputs, and typography should
remain readable and use consistent semantic roles across screens.

## Scope

- Audit every user-facing route in `apps/web/src/app`, including student,
  faculty, organization, and admin areas.
- Audit every screen under `apps/mobile/lib/screens`.
- Review shared web components and mobile theme/shared UI components used by
  those routes.
- Check every supported color palette in light and dark mode.
- Cover page backgrounds, nested surfaces/cards, borders, headings/body/muted
  text, buttons and their states, form fields, dialogs, navigation, and status
  colors.
- Correct inconsistencies found during the audit while preserving screen
  structure and product behavior.

## Existing Constraints and Starting Point

- Web themes are defined through CSS custom properties in
  `apps/web/src/app/globals.css` and selected by `ThemeProvider`.
- Mobile themes are built in `apps/mobile/lib/core/theme.dart` and selected by
  `AppearanceService`.
- Both platforms currently expose navy, violet, orange, maroon, army green,
  black, and grey palettes.
- Web uses Inter/Aptos/Segoe UI fallbacks; mobile uses platform-default sans
  text but applies a serif face to some larger headings.
- Existing colors and component styles outside the theme tokens must be
  inspected rather than presumed to be intentional or erroneous.

## Goals

- Use the existing semantic token systems as the source of truth where possible.
- Align the meaning and light/dark behavior of equivalent colors, controls, and
  typography across platforms.
- Ensure all readable text and interactive controls retain appropriate contrast
  and visible interactive states in both modes.
- Make visual findings actionable by recording each discrepancy by platform,
  screen/component, and mode before applying a correction.
- Add or update focused checks for shared theme mappings and any reusable
  controls changed.

## Non-Goals

- No layout or information-architecture redesign.
- No changes to authentication, attendance, permissions, navigation, or other
  product behavior.
- No requirement for web and mobile to be pixel-identical; platform-native
  composition is retained.
- No new theme engine, dependency, or generated token pipeline unless the audit
  demonstrates that existing mechanisms cannot meet the goals.
- No unrelated cleanup or restyling.

## Implementation Approach

1. Inventory user-facing routes and shared UI components on both platforms.
2. Inspect each route/component in light and dark modes, across supported
   palettes, using source review and available runtime rendering.
3. Record concrete inconsistencies and distinguish intentional brand/status
   colors from accidental hard-coded mode-specific values.
4. Fix shared token or component causes first; make screen-local changes only
   when the inconsistency is genuinely local.
5. Check buttons, inputs, cards, dialog/navigation surfaces, typography, text
   colors, focus/disabled/error states, and contrast after corrections.
6. Add regression checks for shared color mappings and run focused web and
   mobile validation, escalating to existing full frontend test/type/lint
   gates when practical.

## Decisions Left to the Builder

- Keep each platform's existing native layout patterns while matching visual
  semantics.
- Prefer existing tokens and component helpers; avoid a broad component rewrite.
- Treat semantic status colors as status colors, not palette accents, unless the
  audit identifies a specific contrast or meaning problem.
- If runtime rendering is unavailable for a route or palette, state the gap
  rather than claiming visual verification.

## Completion Criteria

- Every user-facing web and mobile screen has been considered in both light and
  dark mode.
- Each supported palette is covered by shared-token checks or equivalent
  systematic validation.
- No known unintended hard-coded colors or typography exceptions remain in the
  audited component/screen surfaces.
- Findings and any screens that could not be visually rendered are reported.
- Focused tests and available static validation pass, with pre-existing
  unrelated failures identified separately.
