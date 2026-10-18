# Cross-Platform Theme Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing web routes and Flutter screens use consistent, readable semantic theme roles in light and dark mode across all seven supported palettes, correcting the concrete discrepancies found in the audit.

**Architecture:** Keep each platform's existing theme source of truth: web CSS custom properties selected through `ThemeProvider`, and Flutter `AppTheme.build` selected through `AppearanceService`. Audit shared tokens/components first, then correct only genuine route/screen-local exceptions; preserve existing layouts and behavior.

**Tech Stack:** Next.js 16, React 19, CSS custom properties/Tailwind, Node's built-in `node:test`; Flutter/Dart, Material `ThemeData`, `flutter_test`.

**Spec:** `docs/superpowers/specs/2026-10-19-cross-platform-theme-consistency-design.md`

## Global Constraints

- No layout or information-architecture redesign.
- No changes to authentication, attendance, permissions, navigation, or other product behavior.
- No requirement for web and mobile to be pixel-identical; platform-native composition is retained.
- No new theme engine, dependency, or generated token pipeline unless the audit demonstrates that existing mechanisms cannot meet the goals.
- No unrelated cleanup or restyling.
- Use the existing semantic token systems as the source of truth where possible.
- Treat semantic status colors as status colors, not palette accents, unless the audit identifies a specific contrast or meaning problem.
- If runtime rendering is unavailable for a route or palette, state the gap rather than claiming visual verification.

## Review Focus

- Every supported palette in both modes: its semantic background, surface, border, text, and action mappings must be present and remain readable. Pin the complete palette/mode mapping in Tasks 1 and 3.
- Dark mode after changing palette or mode (including system mode where available): the active root theme and screen surfaces must not retain stale light-mode styling. Pin token selection in Task 1 and exercise shared Flutter surfaces in Task 3.
- Hard-coded colors on an individual route/screen: preserve a literal only when it is intentionally semantic (for example, success/error/status or camera/scan preview); otherwise use the existing semantic token. Pin each confirmed exception with a focused test in Tasks 2 or 4 before correcting it.
- Interactive states: focus, disabled, hover/selected, and error styling must remain visible against the active surface. Add a focused shared-control regression assertion in Tasks 1 or 3 when the audited component has a discrepancy.
- Typography and muted text: headings, body, and secondary labels must keep their intended hierarchy and readable contrast without overriding platform-native composition. Pin confirmed shared or screen-local exceptions in the owning task's test.

---

### Task 1: Web Shared Tokens and Components

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify as findings require: `apps/web/src/components/ThemeProvider.tsx`, `apps/web/src/components/DashboardUi.tsx`, `apps/web/src/components/DashboardNav.tsx`, `apps/web/src/components/student/StudentUi.tsx`, `apps/web/src/components/student/StudentShell.tsx`, and shared form/dialog/navigation components under `apps/web/src/components/`
- Create: `apps/web/tests/theme-consistency.test.mjs`

**Interfaces:**
- Consumes: `ThemeProvider`'s `ThemeName`, `ThemeMode`, and root attributes `data-color-theme` / `data-mode`; CSS semantic variables such as `--background`, `--foreground`, `--muted`, `--surface`, `--surface-muted`, `--border`, `--primary`, `--primary-strong`, `--primary-soft`, `--accent`, `--success`, `--warning`, `--error`, `--action-background`, and `--action-foreground`.
- Produces: Existing CSS variable names and the existing `ThemeProvider` API remain the shared web theme contract; do not add a parallel token system.

- [x] **Step 1: Add failing web palette/mode regression tests before shared-style edits.** In `theme-consistency.test.mjs`, use `node:test` and `node:assert/strict` to read `src/app/globals.css`; assert the seven `ThemeName` values (`navy`, `violet`, `orange`, `maroon`, `army-green`, `black`, `grey`) each have both default/light and `[data-mode="dark"]` mappings for background, surface, muted surface, border, primary, primary-strong, primary-soft, and accent. Assert action foreground/background and the three status tokens have declared semantic mappings. Add focused cases for each shared control discrepancy the initial review confirms, covering the affected token and its light/dark selectors. Use no new test dependency.
- [x] **Step 2: Run the new test and confirm it exposes the targeted missing/mismatched mapping or control rule.**

Run from `apps/web`: `node --test tests/theme-consistency.test.mjs`

Expected: At least the deliberately targeted regression assertion fails before its correction; unrelated palette mappings are reported separately rather than hidden by one broad assertion.

- [x] **Step 3: Inventory and inspect shared web styling.** Review `globals.css` token definitions and shared dashboard/student CSS selectors, then inspect the shared files listed above plus common buttons, inputs, dialogs, navigation, and theme settings found under `src/components`. Search for literal color utilities/CSS values and font overrides. For each confirmed discrepancy, record platform, shared component/token, mode, palette if relevant, expected semantic role, and planned correction before editing; distinguish brand/status/media colors from accidental theme-specific styling.
- [x] **Step 4: Correct confirmed shared causes in tokens or shared components.** Keep the current token names, palette names, `ThemeProvider` state contract, and component interfaces. Change a shared token/component when it explains multiple findings; use semantic variables for accidental literals and only add/adjust shared states needed for readable focus, disabled, selected, and error styling. Do not restyle components merely for preference.
- [x] **Step 5: Run web shared regression tests and lint.**

Run from `apps/web`: `node --test tests/theme-consistency.test.mjs` and `npm run lint`

Expected: All theme mapping and shared-control assertions pass; lint exits successfully.

### Task 2: Web Route-Level Exceptions

**Files:**
- Inspect and modify only where a confirmed local exception remains: `apps/web/src/app/page.tsx`; `auth/reset-password/page.tsx`; `login/page.tsx`; `forgot-password/page.tsx`; all 12 `dashboard/**/page.tsx` routes; all 19 `student/**/page.tsx` routes; and `student/verify-email/VerifyEmailInner.tsx`.
- Test: Add route-specific regression assertions to `apps/web/tests/theme-consistency.test.mjs` for each confirmed local discrepancy (or to a narrowly scoped existing test when it already owns that behavior).

**Interfaces:**
- Consumes: Task 1's unchanged CSS token contract and shared components.
- Produces: Route/screen-local presentation fixes only; URL structure, route logic, behavior, and layouts remain unchanged.

- [x] **Step 1: Enumerate and audit all user-facing web route pages.** Walk every `page.tsx` under `apps/web/src/app`, excluding API handlers, and include `VerifyEmailInner.tsx` as the verify-email screen implementation. The current inventory is the root page; `/auth/reset-password`, `/login`, `/forgot-password`; `/dashboard`, `/dashboard/admin`, `/dashboard/analytics`, `/dashboard/events`, `/dashboard/faculty`, `/dashboard/faculty/check-in`, `/dashboard/monitor`, `/dashboard/org`, `/dashboard/org/bingo`, `/dashboard/profile`, `/dashboard/reports`, `/dashboard/settings`; `/student`, `/student/attendance/location`, `/student/attendance/otp`, `/student/attendance/scan`, `/student/attendance/selfie`, `/student/bingo`, `/student/events`, `/student/events/[id]`, `/student/feedback/[eventId]`, `/student/notifications`, `/student/profile`, `/student/profile/edit`, `/student/forgot-password`, `/student/forgot-password/code`, `/student/login`, `/student/onboarding`, `/student/register`, `/student/terms`, and `/student/verify-email`. Reconcile the list against the live route tree before considering coverage complete.
- [x] **Step 2: Inspect each route in both light and dark modes.** Trace shared children when needed and check page canvas/nested cards, headings/body/muted text, controls and states, dialog/overlay, navigation, and status colors. Use focused source searches for hard-coded colors, theme-unaware utility classes, and font overrides; inspect rendered routes when runtime access is available. Record concrete exceptions by route/component, mode, and palette before changing them. Apply the Review Focus contrast/state/typography checks to confirmed findings.
- [x] **Step 3: Add a failing focused regression assertion for each confirmed route-local discrepancy.** Name the route or component and the incorrect mode/state; assert the expected existing semantic token or intended semantic status behavior. Do this before its correction. Prefer the existing Node test file from Task 1; do not add broad snapshot coverage or a new testing stack.
- [x] **Step 4: Fix confirmed route-local exceptions only.** Prefer the Task 1 shared fix if it resolves the issue; otherwise make a narrow class/style change in the owning page or component. Preserve route logic, screen structure, and intentionally distinct status/brand/media colors. Do not rewrite pages or normalize intentional platform/route differences.
- [x] **Step 5: Run route regression tests and lint.**

Run from `apps/web`: `node --test tests/theme-consistency.test.mjs` and `npm run lint`

Expected: The route-local regression cases pass and lint reports no new errors.

### Task 3: Flutter Shared Theme and Components

**Files:**
- Modify: `apps/mobile/lib/core/theme.dart`
- Modify only as findings require: `apps/mobile/lib/widgets/student_ui.dart`, `apps/mobile/lib/widgets/appearance_sheet.dart`, `apps/mobile/lib/widgets/student_account_status_dialog.dart`, `apps/mobile/lib/widgets/permission_gate.dart`, `apps/mobile/lib/widgets/universal_loader.dart`, and shared theme wiring in `apps/mobile/lib/main.dart`
- Modify: `apps/mobile/test/widget_test.dart` (extend the existing shared-banner and palette-selection coverage)

**Interfaces:**
- Consumes: `AppColorTheme.values`, `AppTheme.build(AppColorTheme selected, Brightness brightness)`, `AppearanceService.instance.colorTheme` / `.themeMode`, and `StudentUi.of(BuildContext)` semantic getters (`border`, `accent`, `accentSoft`, `accentText`, `muted`, `neutralBackground`).
- Produces: `AppTheme.build` and shared widget APIs stay the source of truth; screens continue consuming Flutter `ThemeData`/`ColorScheme` and existing `StudentUi` helpers.

- [x] **Step 1: Add failing Flutter regression tests before shared-theme edits.** Extend `widget_test.dart` with a test of every `AppColorTheme.values` member under `Brightness.light` and `Brightness.dark` using `AppTheme.build`. Assert the expected `scaffoldBackgroundColor`, `colorScheme.surface`, `colorScheme.primary`, `colorScheme.outline`, and readable `onSurface` / button foreground relationships. Add focused widget tests for any confirmed shared input/button/banner/dialog/navigation state discrepancies, asserting visible focus/error/disabled semantics rather than pixels.
- [x] **Step 2: Run the focused test and confirm the targeted discrepancy fails.**

Run from `apps/mobile`: `flutter test test/widget_test.dart --plain-name "AppTheme covers every palette in light and dark modes"`

Expected: The assertion for the selected faulty shared mapping/state fails before correction; keep each palette/mode case independently identifiable.

- [x] **Step 3: Inspect shared Flutter theme and controls.** Review `core/theme.dart`, `main.dart` theme selection, `AppearanceService` integration, `StudentUi`, and shared widgets listed above. Search for literal `Color(...)`, `Colors.*`, and explicit font-family/style overrides. Record each concrete discrepancy by shared component/token, mode, and palette before edits; leave status colors alone unless a specific meaning or contrast failure is demonstrated.
- [x] **Step 4: Correct shared Flutter mappings/components.** Adjust `AppTheme.build` or the owning shared widget to use the existing `AppColorTheme` and Material semantic `ColorScheme` fields consistently. Keep existing theme/mode persistence and API behavior; don't change `AppearanceService` unless inspection proves a theme selection defect.
- [x] **Step 5: Run Flutter shared regressions and analyzer.**

Run from `apps/mobile`: `flutter test test/widget_test.dart` and `flutter analyze`

Expected: All fourteen palette/brightness combinations and shared widget assertions pass; analyzer exits without new issues.

### Task 4: Flutter Screen Exceptions

**Files:**
- Inspect every screen under `apps/mobile/lib/screens/`: `attendance/{attendance_otp_screen.dart,attendance_resolve_screen.dart,location_check_screen.dart,qr_scan_screen.dart,selfie_screen.dart}`, `auth/{forgot_password_code_screen.dart,forgot_password_screen.dart,login_screen.dart,register_confirm_screen.dart,register_id_scan_screen.dart,register_password_screen.dart,verify_email_screen.dart}`, `bingo/bingo_screen.dart`, `events/{events_screen.dart,event_detail_screen.dart,event_feedback_screen.dart}`, `home/home_screen.dart`, `notifications/notifications_screen.dart`, `onboarding/{onboarding_screen.dart,swipe_animated_page.dart,terms_screen.dart}`, `profile/{edit_profile_screen.dart,profile_screen.dart}`, and `shell/main_shell.dart`.
- Modify only confirmed screen-local exceptions among the files above.
- Test: Add focused widget/regression cases to `apps/mobile/test/widget_test.dart` or a narrowly scoped existing test.

**Interfaces:**
- Consumes: Task 3's `AppTheme.build` mappings, Material `ThemeData`/`ColorScheme`, and existing shared widget APIs.
- Produces: Corrected local screen styling without changes to navigation, attendance, authentication, permissions, or screen composition.

- [x] **Step 1: Audit every listed screen in light and dark mode.** Inspect screen surfaces, cards, text hierarchy, fields/buttons and states, dialogs, navigation, status colors, and typography. Search for theme-independent colors/styles and follow reusable widget usage. When a device/emulator or practical runtime rendering is available, inspect each screen in representative light/dark configurations and all palettes systematically; record any unavailable visual cases rather than claiming they were checked.
- [x] **Step 2: Record and test each confirmed screen-local discrepancy before fixing it.** Record its screen/component, mode, palette where applicable, observed style, and expected semantic role. Add the smallest failing widget or helper assertion that demonstrates that issue; cover the relevant Review Focus state or text contrast. Do not introduce golden-image dependencies.
- [x] **Step 3: Apply narrow screen-local corrections.** Prefer an existing `ThemeData` field or `StudentUi` helper from Task 3; retain a screen-local style only when it is intentionally semantic or specific to native media/interaction. Preserve the screen's structure and behavior.
- [x] **Step 4: Run focused screen tests and analyzer.**

Run from `apps/mobile`: `flutter test test/widget_test.dart` and `flutter analyze`

Expected: The new regression tests pass and no new analyzer issues are introduced.

### Task 5: Cross-Platform Verification

**Files:**
- Verify: all files changed in Tasks 1–4; no product changes beyond the recorded theme corrections.

**Interfaces:**
- Consumes: Existing web semantic CSS variables and Flutter `AppTheme.build` mappings, plus both platforms' focused regression suites.
- Produces: Verified completion of the complete route/screen audit, concrete fixes, and a concise report of any remaining visual-rendering gaps.

- [x] **Step 1: Reconcile the audit inventories.** Confirm every current `apps/web/src/app/**/page.tsx` route (excluding API handlers) and every `apps/mobile/lib/screens/**/*.dart` screen was considered in both modes. Ensure recorded discrepancies received a regression check and an applied correction or a documented reason to preserve the style.
- [x] **Step 2: Verify all palette/mode mappings and focused regression suites.**

Run from `apps/web`: `node --test tests/theme-consistency.test.mjs`

Run from `apps/mobile`: `flutter test test/widget_test.dart`

Expected: All seven palettes pass in light and dark mode on each platform, including focused shared/route/screen cases.

- [x] **Step 3: Run available project gates.**

Run from `apps/web`: `npm run lint` and `npm run build`

Run from `apps/mobile`: `flutter analyze` and `flutter test`

Expected: All commands pass; report any unrelated pre-existing failures separately. The web manifest currently exposes only `lint` and `build`, so use the direct `node --test` command for the new focused test rather than assuming an npm test script exists.

- [x] **Step 4: Perform feasible visual spot checks and report scope honestly.** Render representative light/dark screens in each palette where runtime access is available, emphasizing the shared controls and every recorded correction. Do not claim visual coverage for routes/palettes that could not be rendered. Report completed route/screen coverage, concrete fixes, commands/results, and any remaining visual gaps; do not leave the deliverable as an audit-only report.

## Audit Completion Record

- Inventory reviewed: 35 web route pages (excluding API handlers) and 24 Flutter screens. Static scans covered palette-specific utilities/colors, explicit color constructors, and font-family overrides; remaining fixed colors are intentional status, branding/reward, QR, or camera-preview colors.
- Corrected web route exceptions: password strength indicators now use semantic status/surface tokens; disabled event actions and student profile fallback/upload controls now use theme-aware semantic colors. Authenticated admin visual inspection found and fixed a dark-sidebar wordmark contrast regression caused by a later `filter: none` override; a regression test verifies the final cascade retains the white logo treatment.
- Palette contrast was measured from browser-computed CSS tokens in all 14 palette/mode combinations. Minimum ratios were 12.48:1 for foreground text on surfaces, 5.20:1 for muted text, 9.31:1 for strong headings, 6.04:1 for primary text, 5.32:1 for status text, and 4.75:1 for focus accents. Action foreground/background minimum was 6.04:1.
- Visual checks: rendered student sign-in in default light and dark orange modes, and the student password-reset screen in light mode. With supplied test accounts, rendered admin workspace in light/dark and organization workspace in light/dark; the admin dark-mode logo issue was fixed and visually rechecked. The faculty login was rejected with invalid credentials. The student login succeeded, but the student workspace stayed at its onboarding/loading gate; no terms or onboarding consent was submitted. Admin-accessible faculty check-in screens and camera-feed appearance were not visually verified.
- Verification: web theme tests 28/28; web lint and production build succeeded. Lint reports six non-blocking warnings. Focused Flutter theme/Forgot Password tests passed; scoped analysis of changed theme files found no issues. Full Flutter tests retain one unrelated case-sensitive “Account disabled” expectation failure, and full analysis reports two existing Radio API deprecation infos in `appearance_sheet.dart`.
