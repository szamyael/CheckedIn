# CheckedIn Interface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a cohesive toolkit-inspired visual system to the shared web dashboard experience without changing product behavior.

**Architecture:** Keep the current Next.js/Tailwind structure and use the existing CSS variable theme layer as the source of truth. Remodel the dashboard shell and shared UI primitives first, then update the Org Member and Admin compositions to consume those primitives.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, existing icon library, existing theme settings.

**Spec:** `docs/superpowers/specs/2026-10-15-checkedin-interface-redesign-design.md`

## Global Constraints

- Preserve all existing routes, permissions, workflows, and data behavior.
- Do not add a dependency or remote font loading for this pass.
- Preserve visible keyboard focus, semantic labels, dark mode, and responsive behavior.
- Use the provided `toolkit` directory as visual reference, not as copied product content.

## Review Focus

- Narrow mobile widths: navigation and data tables must not create page-level horizontal overflow.
- Dark mode: new surfaces and text must remain readable in every existing color theme.
- Keyboard navigation: active navigation, buttons, selects, and tables must retain clear focus states.
- Dense operational data: status, paid/unpaid, pending, and error states must remain distinguishable without color alone.
- Existing theme settings: switching color theme or mode must still update the redesigned shell.

---

### Task 1: Establish dashboard visual tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Test: `apps/web/tests/dashboard-theme.test.mjs`

**Interfaces:**
- Produces stable CSS variables and utility class behavior consumed by all dashboard components.

- [ ] **Step 1: Write failing tests** for the required token names and state contrast contract, including `--dashboard-canvas`, `--dashboard-panel`, `--dashboard-primary`, `--dashboard-success`, and `--dashboard-attention`.
- [ ] **Step 2: Run the focused test and verify it fails** because the new tokens do not exist.
- [ ] **Step 3: Add the semantic dashboard tokens** and responsive shell utility styles while preserving existing theme selectors and dark-mode overrides.
- [ ] **Step 4: Run the focused test and verify it passes.**
- [ ] **Step 5: Run targeted ESLint and TypeScript checks.**

### Task 2: Remodel the shared dashboard shell

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.tsx`
- Modify: `apps/web/src/components/DashboardNav.tsx`
- Modify: `apps/web/src/components/BrandLogo.tsx`
- Test: `apps/web/tests/dashboard-shell.test.mjs`

**Interfaces:**
- Consumes the existing role-derived `DashboardNavItem[]`.
- Produces the same navigation routes and sign-out/theme/notification controls with updated layout and visual states.

- [ ] **Step 1: Write failing tests** asserting every rendered navigation item has an accessible name, active-state marker, and preserved route href.
- [ ] **Step 2: Run the focused test and verify it fails** against the current shell markup.
- [ ] **Step 3: Implement the compact rail/topbar composition** using semantic `aside`, `nav`, `header`, and focus-visible classes; keep role-specific item generation unchanged.
- [ ] **Step 4: Run the focused test and verify it passes.**
- [ ] **Step 5: Verify desktop and narrow viewport layout through the existing web build and a browser smoke check.**

### Task 3: Remodel shared dashboard primitives

**Files:**
- Modify: `apps/web/src/components/DashboardUi.tsx`
- Modify: `apps/web/src/components/ReportFilters.tsx`
- Modify: `apps/web/src/components/OrganizationMembershipPanel.tsx`
- Test: `apps/web/tests/dashboard-primitives.test.mjs`

**Interfaces:**
- Preserve `DashboardPageHeader`, `DashboardStat`, and `DashboardSection` prop signatures.
- Preserve membership actions, report generation, filters, and status semantics.

- [ ] **Step 1: Write failing tests** for heading hierarchy, stat label/value/detail grouping, and membership status/action labels.
- [ ] **Step 2: Run the focused test and verify it fails** against the current visual structure.
- [ ] **Step 3: Update the primitives and membership panel** to use the new token classes, stronger status badges, responsive table treatment, and consistent action hierarchy without changing handlers or API calls.
- [ ] **Step 4: Run the focused test and verify it passes.**
- [ ] **Step 5: Check keyboard focus and reduced-width rendering.**

### Task 4: Apply the system to role dashboards

**Files:**
- Modify: `apps/web/src/app/dashboard/org/page.tsx`
- Modify: `apps/web/src/app/dashboard/admin/page.tsx`
- Modify: `apps/web/src/app/dashboard/faculty/page.tsx`
- Test: existing web tests plus `apps/web/tests/dashboard-compositions.test.mjs`

**Interfaces:**
- Consume the shared shell and primitives from Tasks 1–3.
- Preserve all server-side queries, redirects, role checks, and existing child-component props.

- [ ] **Step 1: Write failing composition tests** asserting each role dashboard exposes a clear page title, primary action area, summary metrics, and its existing operational sections.
- [ ] **Step 2: Run the focused test and verify it fails** against the current page composition.
- [ ] **Step 3: Recompose the role dashboards** into the new grid/card hierarchy while keeping all existing data and behavior intact.
- [ ] **Step 4: Run focused and full web tests.**
- [ ] **Step 5: Run TypeScript, ESLint, and production build.**

### Task 5: Visual verification and cleanup

**Files:**
- Modify: only files required by verification findings.

- [ ] **Step 1: Run the web app in development mode and inspect admin, Org Member, and faculty dashboards at desktop and mobile widths.**
- [ ] **Step 2: Verify light mode, dark mode, and at least two existing color themes.**
- [ ] **Step 3: Fix only layout, contrast, overflow, or focus regressions caused by the redesign.**
- [ ] **Step 4: Run the complete verification suite again and report any pre-existing warnings separately.**
