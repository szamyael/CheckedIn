# CheckedIn — Web & Mobile App Design Specification

**Document type:** UI/UX design and implementation guide  
**Product:** CheckedIn  
**Design direction:** Soft-modern, minimalist, people-first attendance platform  
**Reference:** The supplied three-screen mobile attendance UI (attendance history, dashboard, and leave request)  
**Primary objective:** Establish one recognizable CheckedIn identity and apply it consistently across the web application and mobile app.

---

## 1. Product and design vision

CheckedIn should feel like a modern attendance platform built for real people—not a traditional administrative system covered in tables, dense forms, and unrelated widgets. The interface should make the most important information immediately understandable: **who is present, what their attendance status is, when they checked in or out, and what action they can take next.**

The supplied reference is a useful visual foundation because it combines:

- A calm, warm-neutral background with muted sage-green accents.
- White rounded cards that group related information.
- Clear typography and compact data presentation.
- A calendar-led attendance history.
- Simple check-in and check-out summaries.
- A leave request form that is structured into manageable sections.
- A five-destination mobile navigation bar with a prominent central action.

CheckedIn should adopt these principles without copying the reference screen-for-screen. Its own identity should come from the **CheckedIn brand mark, signature QR/check-in interaction, role-aware dashboards, recognizable attendance status system, and consistent visual language** across platforms.

### Design principles

1. **Clarity before decoration** — users should understand a screen at a glance.
2. **Attendance is the central workflow** — check-in, check-out, and attendance status should be easy to find.
3. **Calm, not sterile** — use warm neutrals and restrained green accents to make the product approachable.
4. **Consistent, not repetitive** — shared components should look related while layouts adapt to each task and device.
5. **Responsive by design** — mobile should not be a compressed desktop layout, and desktop should not be an enlarged phone screen.
6. **Honest status communication** — show actual system state, explain errors, and never rely on color alone.
7. **Respect existing functionality** — redesign the presentation without breaking the product's current workflows, permissions, integrations, or data model.

---

## 2. CheckedIn brand identity

### 2.1 Brand idea

**Brand concept: “A clear record of every arrival.”**

CheckedIn connects a person's presence with a verified attendance event. The identity should communicate reliability, simplicity, and connection. It should feel appropriate for employees, students, teams, and administrators without looking overly corporate or playful.

**Suggested brand line:**  
*Show up. Stay connected.*

The line is optional and can be used in onboarding, sign-in screens, presentations, or marketing materials. It should not be repeated throughout the product interface.

### 2.2 Brand personality

| Attribute | Design expression |
|---|---|
| Reliable | Consistent layouts, accurate status labels, clear confirmations |
| Approachable | Warm neutral surfaces, friendly language, restrained rounded shapes |
| Organized | Clear hierarchy, grouped cards, predictable navigation |
| Modern | Clean typography, precise icons, responsive layouts |
| Efficient | Quick access to scanning, simple forms, useful summaries |

Avoid making CheckedIn look like a finance dashboard, a gaming app, or a generic admin template. The tone should be professional and reassuring.

### 2.3 Signature visual symbol — the CheckedIn Mark

Create a compact brand symbol that can work as an app icon, favicon, sidebar logo, loading mark, and QR/check-in action icon.

**Recommended concept:** a rounded-square or softly circular container with four subtle scan-corner brackets framing a clear checkmark. The scan brackets represent QR verification; the checkmark represents a successfully recorded attendance event. The shape should remain legible at 16–24 px and should not contain tiny details.

Design rules:

- Use a solid deep-sage or primary-sage container for the main app icon.
- Use a white checkmark and simple scan-corner geometry inside it.
- Keep the mark visually balanced and avoid adding a clock, pin, person, or multiple symbols all at once.
- Use the wordmark **CheckedIn** beside the symbol in the web sidebar and sign-in screens.
- Use the symbol alone in compact navigation, mobile app icons, and favicons.
- Do not redraw the mark differently on each platform.

The symbol is a design direction, not a claim about the existing logo. If CheckedIn already has an approved logo, preserve its recognizable elements and adapt the app symbol to match it rather than replacing the brand without review.

### 2.4 Signature interaction — the CheckedIn Scan Action

The central QR/check-in action should become the most recognizable interaction in the mobile app.

**Visual treatment:**

- Circular primary-sage button, approximately 54–64 px in diameter on typical phones.
- White scan/QR icon, 22–26 px.
- A restrained outer ring or soft shadow to lift it slightly above the bottom navigation surface.
- A short label such as **Scan** or **Check In**, based on the actual workflow and available space.
- Active, pressed, loading, disabled, and success states.

**Interaction behavior:**

1. The button opens the actual configured QR workflow—do not assume one scanning mode if the product supports more than one.
2. Explain camera permission requirements before or when permission is needed.
3. Display a clear scanning frame and short instruction.
4. Show progress while a code is being validated.
5. Confirm success with the recorded event and time.
6. Explain invalid, expired, already-used, offline, or unauthorized QR codes in plain language.
7. Provide a clear route back to the dashboard after completion.

The central action must not be decorative. It must connect to the existing attendance implementation and respect the user's role and permissions.

### 2.5 Brand voice and interface language

Use concise, calm, human wording.

| Use | Recommended wording |
|---|---|
| Greeting | “Good morning” / “Welcome back” |
| Check-in action | “Scan to check in” |
| Success | “You're checked in.” |
| Check-out success | “Your check-out has been recorded.” |
| Empty history | “No attendance records for this period.” |
| Loading | “Checking your attendance…” |
| Permission | “Allow camera access to scan the QR code.” |
| Error | “We couldn't verify that QR code. Try again or ask your administrator for help.” |

Avoid unclear technical messages such as “Request failed,” “Invalid payload,” or “Error 500” as the primary user-facing explanation. Technical details may be logged for diagnostics, but the interface should communicate what happened and what the user can do next.

---

## 3. Visual design system

The values below are recommended starting tokens. Implement them centrally and adjust after checking the actual brand assets, contrast, and existing application styles.

### 3.1 Color palette

#### Core brand colors

| Token | Hex | Intended use |
|---|---|---|
| `brand.primary` | `#587D70` | Primary buttons, active navigation, selected states |
| `brand.deep` | `#42675B` | Strong emphasis, pressed states, dark green surfaces |
| `brand.dark` | `#2F4D43` | High-contrast brand surfaces and selected text on pale green |
| `brand.soft` | `#E5EEEA` | Soft highlight surfaces, selected chips, icon backgrounds |
| `brand.pale` | `#EFF4F1` | Subtle brand-tinted backgrounds |

#### Neutral colors

| Token | Hex | Intended use |
|---|---|---|
| `surface.page` | `#F7F8F7` | Main application canvas |
| `surface.card` | `#FFFFFF` | Cards, panels, dialogs |
| `surface.subtle` | `#F1F3F1` | Input surfaces and secondary panels |
| `text.primary` | `#242927` | Main headings and values |
| `text.secondary` | `#777F7B` | Descriptions and secondary information |
| `text.muted` | `#929A96` | Hints, timestamps, disabled labels |
| `border.subtle` | `#E9ECEA` | Dividers and restrained outlines |

#### Status colors

| Status token | Suggested color | Meaning |
|---|---|---|
| `status.success` | `#4E9875` | Present, approved, completed, verified |
| `status.warning` | `#D6A34B` | Late, pending attention, nearing a limit |
| `status.danger` | `#D66B6B` | Absent, rejected, failed, overdue where applicable |
| `status.info` | `#648DB5` | Informational or neutral system update |
| `status.neutral` | `#929A96` | Not recorded, inactive, or unspecified |

**Status rules:**

- Pair each status color with a text label and, where useful, an icon.
- Do not communicate “Present,” “Late,” or “Absent” using color alone.
- Do not use green for every interactive element. Preserve it for primary actions and meaningful active states.
- Verify text/background combinations for WCAG contrast. Adjust token shades when required rather than preserving a color at the expense of readability.

### 3.2 Typography

**Primary typeface:** Inter.  
**Fallback:** system UI sans-serif stack.

| Style | Suggested size | Weight | Typical use |
|---|---:|---:|---|
| Display metric | 28–32 px | 650–700 | Main dashboard values |
| Page title | 22–26 px | 600–700 | Main page heading |
| Section heading | 16–18 px | 600 | Dashboard sections |
| Card title | 14–16 px | 600 | Card headings |
| Body | 13–14 px | 400–500 | General information |
| Label | 12–13 px | 500–600 | Form labels and small headings |
| Caption | 11–12 px | 400–500 | Hints, metadata, timestamps |
| Navigation | 10–12 px | 500–600 | Navigation labels |

Use tabular numerals for dates, clock times, durations, and metrics so that numerical values align cleanly. Avoid making every heading bold or oversized.

### 3.3 Spacing scale

Use a consistent 4 px base spacing system.

| Token | Value | Typical use |
|---|---:|---|
| `space.1` | 4 px | Icon-to-label micro gap |
| `space.2` | 8 px | Compact internal spacing |
| `space.3` | 12 px | Tight card and control spacing |
| `space.4` | 16 px | Standard card padding |
| `space.5` | 20 px | Mobile page gutter |
| `space.6` | 24 px | Section spacing |
| `space.8` | 32 px | Desktop content spacing |
| `space.10` | 40 px | Major layout separation |
| `space.12` | 48 px | Large section separation |

Avoid arbitrary one-off spacing values when an existing token is appropriate.

### 3.4 Corner radius

| Token | Value | Intended use |
|---|---:|---|
| `radius.sm` | 8 px | Small chips and compact controls |
| `radius.md` | 12 px | Inputs, buttons, small panels |
| `radius.lg` | 16 px | Standard cards |
| `radius.xl` | 20 px | Larger cards and content containers |
| `radius.2xl` | 24 px | Major mobile panels and dialogs |
| `radius.full` | 999 px | Avatars, circular scan action, pills when appropriate |

Rounded corners should look deliberate, not exaggerated. Do not make every container fully pill-shaped.

### 3.5 Shadows and borders

Use elevation sparingly:

- Standard cards: no visible shadow or a very soft shadow such as `0 2px 10px rgba(30, 45, 38, 0.04)`.
- Floating scan action: slightly stronger but still subtle shadow.
- Menus and popovers: enough elevation to separate them from the page.
- Dialogs: moderate elevation and a restrained backdrop.

Prefer a light divider or subtle border over a heavy shadow. Avoid dark outlines around every card.

### 3.6 Icon system

Use one coherent outline icon family, preferably Lucide. Keep stroke weight and visual scale consistent.

- Standard interface icon: 18–20 px.
- Prominent action icon: 22–26 px.
- Small status icon: 14–16 px.
- Use filled icon backgrounds only when they help distinguish an important category or action.
- Do not mix emoji, filled glyphs, and unrelated icon packs as the main interface icon system.

---

## 4. Global application architecture

CheckedIn should have two related but distinct shells: a **desktop web shell** and a **mobile app shell**. Both use the same color, typography, spacing, icon, card, and status systems.

### 4.1 Web application shell

Recommended desktop structure:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar      │ Top bar: Page title / Search / Notifications / User   │
│              ├───────────────────────────────────────────────────────┤
│ CheckedIn    │                                                       │
│              │              Main page content                        │
│ Overview     │                                                       │
│ Attendance   │      Header                                          │
│ People       │      Summary cards                                   │
│ Leave        │      Charts / tables / forms                          │
│ Reports      │                                                       │
│ Settings     │                                                       │
│              │                                                       │
│ User profile │                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Sidebar guidance:**

- Use a fixed or sticky sidebar on larger desktop screens.
- Place the CheckedIn mark and wordmark at the top.
- Group navigation by task, not by arbitrary component type.
- Use a restrained sage background or a slim sage indicator for the active route.
- Use outline icons with concise labels.
- Support a compact icon-only state when screen space is limited.
- Place account/profile and sign-out actions in a predictable lower section.
- Preserve current routes, route guards, and role-based menu visibility.
- Submenus should remain open long enough for reliable pointer and keyboard interaction; do not close them immediately when the pointer moves between parent and submenu.

**Top bar guidance:**

- Keep the top bar visually quiet and consistent.
- Show a page title or breadcrumb when it improves orientation.
- Include global search only if it searches meaningful application data.
- Group notifications and account controls on the right.
- Keep contextual page actions close to the page heading rather than filling the global header with unrelated buttons.

**Main content area:**

- Use a warm off-white page surface.
- Use a comfortable maximum content width where appropriate, without wasting wide screens.
- Align page titles, cards, filters, and tables to a consistent content grid.
- Use section headings to establish hierarchy.
- Avoid placing every section inside another large card; use containers only where they clarify grouping.

### 4.2 Mobile application shell

Recommended mobile structure:

```text
┌──────────────────────────────┐
│ Page header / greeting       │
│ Date / notifications         │
├──────────────────────────────┤
│ Main page content            │
│ Cards / calendar / forms     │
│                              │
│                              │
├──────────────────────────────┤
│ Home  History  Scan  Leave   │
│                    Settings  │
└──────────────────────────────┘
```

- Use a compact header appropriate to the current screen.
- Use a fixed bottom navigation for the primary destinations where the information architecture supports it.
- Reserve the center position for the CheckedIn scan/check-in action if it is the most frequent and important workflow.
- Keep the navigation background white or warm white with a subtle top divider.
- Account for iOS and Android safe areas and gesture regions.
- Add sufficient bottom padding to scrollable content so the navigation never covers the last card or form button.
- Avoid tiny tap targets or placing multiple critical controls too close together.

---

## 5. Web application layout specification

The web platform should prioritize administration, review, reporting, and information management. It can display more data than the mobile app, but must preserve the same calm and readable visual style.

### 5.1 Web dashboard

**Purpose:** Give the signed-in user a role-appropriate overview and a clear next action.

Recommended section order:

1. **Page header** — greeting or page title, date/context, and one primary contextual action.
2. **Summary metrics** — key totals in a row or responsive grid.
3. **Attendance insight** — trend chart or attendance breakdown where real data is available.
4. **Recent activity** — latest attendance records or recent events.
5. **Pending work** — pending leave requests, exceptions, or approvals where relevant to the user's role.

**Metric cards:**

- Use 3–4 columns on wide displays, 2 columns on smaller desktop/tablet widths, and a compact mobile arrangement.
- Each card should contain a concise label, one prominent number, and a short contextual hint or comparison only when valid.
- Optional icons should use pale sage or restrained status-tinted backgrounds.
- Keep card heights consistent within a row.
- Do not fabricate totals, trends, or percentage changes. All metrics must use actual application data and clearly defined calculation rules.

**Charts:**

- Use charts only when they help answer an operational question.
- Keep chart titles descriptive and legends understandable.
- Use the brand palette with a limited number of series.
- Provide tooltips and accessible text summaries where possible.
- Ensure charts resize correctly and do not become unreadable on small screens.
- Provide an empty state when no data exists.

### 5.2 Web attendance management

Use a clean data-table layout for desktop review.

Recommended page structure:

- Page heading and contextual action.
- Search field and filters in a compact toolbar.
- Date range and status filters where applicable.
- Data table with clear column headings.
- Pagination and record count.
- Row-level actions in a consistent overflow menu.

Possible attendance columns, depending on actual product data:

- Person / employee / student.
- Date.
- Check-in time.
- Check-out time.
- Total hours.
- Attendance status.
- Location or method, if captured.
- Actions.

Table behavior:

- Use subtle horizontal separators rather than heavy cell borders.
- Align numerical values consistently.
- Use status badges with text labels.
- Provide a restrained row hover state.
- Keep headers visible where long tables benefit from sticky headings.
- Support sorting and filtering only where the backend supports them.
- On mobile, convert rows into stacked cards or use a clearly indicated horizontal scroll container when the record has too many fields to condense safely.

### 5.3 Web attendance calendar and history

- Place month/year controls above the calendar.
- Use a consistent seven-column calendar grid.
- Show attendance state using small dots, subtle tinted cells, or short labels.
- Distinguish the selected date with a solid sage circle or a pale sage selected-cell treatment.
- Do not overcrowd each date with multiple symbols.
- Show a details panel or record list for the selected date.
- Include filters for date range and status where appropriate.
- Provide clear previous/next month controls and keyboard focus states.

For larger screens, a calendar and selected-day detail panel may sit side by side. On narrow screens, stack the detail section below the calendar.

### 5.4 Web leave management

Organize leave management into clearly separated tasks:

- Leave overview and balances.
- New leave request form.
- Request history.
- Pending approvals for authorized roles.

A leave request form should include only fields supported by the actual rules and backend, such as leave type, start date, end date, reason, and required attachment. Display validation next to the relevant field. Show the resulting request status and any approval information after submission.

For administrators or approvers, use a review queue with clear request details and explicit approve/reject actions. Confirmation should be required for consequential actions, and the interface should show the result of the operation.

### 5.5 Web people, account, and settings screens

Use the same component system for user/employee/student records, role management, profile, and system settings.

- Use a searchable table for large lists.
- Use profile/detail pages for an individual's information.
- Group settings into named sections rather than presenting one long mixed form.
- Make role and permission information explicit to authorized administrators.
- Keep destructive actions visually distinct and confirm them before execution.
- Preserve existing role-based access rules; the UI must never be the only permission enforcement layer.

---

## 6. Mobile application layout specification

The mobile app should prioritize quick attendance actions, personal attendance information, and short task flows. It should not attempt to show every desktop table or administrative setting at once.

### 6.1 Mobile navigation model

Recommended primary destinations:

1. **Home** — current attendance state and personal overview.
2. **History** or **Analytics** — attendance calendar and records, based on user needs.
3. **Scan / Check In** — central signature action.
4. **Leave** — leave balance, requests, and history if the feature exists for the role.
5. **Settings** or **Profile** — account preferences and user details.

Navigation labels should match the actual app's terminology. Do not show a destination the current role cannot access.

### 6.2 Mobile home dashboard

**Recommended vertical layout:**

1. Compact greeting and notification control.
2. Current date and optional location/context.
3. Prominent attendance state or check-in/check-out panel.
4. Two-column summary cards.
5. Recent attendance list.
6. Optional relevant reminder or pending item.

**Header:**

- Use the user's display name, not an overly long welcome paragraph.
- Keep the notification action aligned to the right.
- Avoid placing too many controls in the header.

**Current attendance panel:**

- Show the user's actual state, for example “Not checked in,” “Checked in,” or “Checked out.”
- Show the recorded check-in/check-out time when available.
- Show total hours only when the calculation is meaningful and clearly defined.
- Provide the next valid action where appropriate.
- Do not display a check-out time or total duration as if it is final when the work session is still open.

**Summary cards:**

- Use a two-column grid on most phones.
- Keep labels short and values prominent.
- Use no more than the most useful 2–4 metrics in the initial viewport.
- Move secondary statistics lower on the page or to an analytics screen.

**Recent activity cards:**

- Place a small date tile on the left.
- Show check-in, check-out, and total time in a readable arrangement.
- Place status and location/method in a secondary line where captured.
- Use consistent card heights when practical, but allow content to grow rather than truncate important information.

### 6.3 Mobile attendance history

Use the reference's calendar-plus-record-list pattern.

**Calendar container:**

- White rounded card on the warm-neutral page background.
- Month and year in the header, centered or left aligned consistently.
- Previous and next month controls on either side.
- Seven weekday columns with enough spacing to tap a date.
- Selected day highlighted using the primary sage.
- Small status indicators for attendance events.
- Muted styling for dates outside the active month.

**Attendance list:**

- Place a “Your Attendance” or role-appropriate section below the calendar.
- Each record should show date, weekday, check-in, check-out, and duration when available.
- Use a status label, not color alone.
- Provide a selected-day empty state if no record exists.
- Consider a month filter or status filter in a compact sheet rather than adding a permanent row of controls above the calendar.

### 6.4 Mobile leave management

Recommended screen order:

1. Page title.
2. Compact user/leave overview, only if useful and permitted.
3. Leave balance summary.
4. Segmented tabs: Request / History.
5. Leave request form or request list.

**Leave request form:**

- Use single-column fields.
- Display start and end dates with clearly labeled date inputs.
- Make leave type a readable selector.
- Use a multi-line reason field with a helpful hint.
- Provide attachment upload only if supported.
- Keep the submit action visible without covering fields; it may be sticky above the bottom navigation if appropriate.
- Show validation inline and retain entered values when validation fails.
- Prevent repeated submission while a request is processing.

**Leave history:**

- Display each request as a compact card.
- Show leave type, dates/duration, submission date, and current status.
- Include approver notes or rejection reasons when available and appropriate.

### 6.5 Mobile profile and settings

- Group account details, security, preferences, and help into separate sections.
- Use clear list rows with icons and optional descriptions.
- Keep destructive actions separated from ordinary settings.
- Do not bury sign-out or security controls inside unrelated content.
- Maintain the same typography, radius, and color rules as the rest of the app.

---

## 7. Role-aware experience

CheckedIn should share one visual system but present different dashboards and navigation based on the authenticated user's actual role and permissions.

### 7.1 Individual user dashboard

For an employee, student, or other attendance participant, prioritize:

- Current attendance status.
- QR check-in/check-out action, where supported.
- Personal attendance history.
- Personal hours or attendance summaries, where applicable.
- Leave requests and status, if enabled for that role.
- Profile and account settings.

Avoid exposing administrative lists, other people's attendance details, or approval controls to users who are not authorized to see them.

### 7.2 Administrator / manager / teacher dashboard

For authorized management roles, prioritize the tasks available to that role, which may include:

- Overall attendance summary.
- Present, absent, late, or unrecorded counts, using the product's actual definitions.
- Attendance review and filtering.
- People or class/group management.
- Leave request review and approval, if enabled.
- Reports and exports, if supported.
- QR session or attendance settings, if supported.

Do not assume that every administrator has every permission. Navigation and page actions must be driven by the existing role and permission model.

### 7.3 Role and permission rules

- Existing backend authorization remains authoritative.
- Hiding a button is not security enforcement.
- Protect routes and API operations on the server.
- Display a helpful access-denied state when a user reaches an unavailable destination.
- Keep role-specific wording configurable so the same design can serve employee and educational attendance workflows.

---

## 8. Shared component specifications

Build a reusable component library so the same patterns are not reinvented on every page.

| Component | Required behavior and appearance |
|---|---|
| `AppSidebar` | Desktop navigation, active route, role-aware items, collapse state |
| `MobileBottomNavigation` | Safe-area aware navigation with central scan action |
| `CheckedInMark` | Reusable brand symbol in full and compact forms |
| `PageHeader` | Title, optional breadcrumb, description, contextual actions |
| `MetricCard` | Label, prominent value, optional icon and context |
| `AttendanceStatusCard` | Actual state, relevant timestamps, next action |
| `AttendanceRecordCard` | Date, time details, status, optional location/method |
| `AttendanceCalendar` | Month controls, date selection, event indicators, keyboard support |
| `StatusBadge` | Text label plus status styling and optional icon |
| `SearchField` | Accessible label, search value, clear behavior where applicable |
| `FilterBar` | Responsive filters and applied-filter indication |
| `DateRangePicker` | Clear labels, valid date range, accessible controls |
| `DataTable` | Sorting/filtering/pagination only where supported; responsive alternative |
| `LeaveBalanceCard` | Available/used balance with clear units and policy context |
| `LeaveRequestForm` | Validated form, submission/loading/success/error states |
| `EmptyState` | Clear explanation and relevant next action |
| `LoadingSkeleton` | Shape-appropriate placeholder that preserves layout |
| `ConfirmationDialog` | Explicit action summary and safe cancellation |
| `Toast / InlineNotice` | Non-blocking success, warning, and error feedback |

Each component should expose a small, consistent set of variants rather than accumulating one-off styling props for individual pages.

---

## 9. Responsive layout rules

Use mobile-first CSS or the responsive strategy already established by the project. The following breakpoints are suggestions; adapt them to the existing framework and content needs.

| Range | Layout behavior |
|---|---|
| Below 480 px | Single-column content, compact page gutters, two-column metric grid only where values fit |
| 480–767 px | Mobile shell, more generous card spacing, stacked forms |
| 768–1023 px | Tablet layout, collapsible navigation, usually two-column content |
| 1024–1279 px | Desktop shell with compact sidebar and responsive content grid |
| 1280 px and above | Full desktop sidebar, 3–4 metric columns, wider data views |

### Responsive rules

- Desktop navigation becomes mobile navigation; do not simply shrink the sidebar until labels become unreadable.
- Desktop tables should become cards or explicitly scrollable tables on small screens.
- Forms should use two columns only when the fields are logically related and there is enough width.
- Charts must have a sensible minimum height and should not overflow their cards.
- Buttons and fields should be comfortably tappable; aim for at least 44 × 44 px interactive targets where practical.
- Keep headings and card text readable; do not solve overflow by shrinking text indefinitely.
- Use responsive images and avoid fixed widths that force horizontal scrolling.
- Test at narrow widths, landscape orientation, and browser zoom.

---

## 10. Interaction, motion, and feedback

### 10.1 Motion principles

Motion should communicate response and state, not decorate the interface.

- Typical transitions: 150–250 ms.
- Use short opacity/position transitions for menus, dialogs, and tab changes.
- Use subtle press feedback for buttons.
- Use a restrained highlight for selected calendar dates.
- Use skeletons for content loading when the layout is predictable.
- Avoid large bounces, excessive parallax, continuous movement, or animations that delay the task.
- Respect `prefers-reduced-motion` and the platform's accessibility settings.

### 10.2 Required component states

Every interactive component should account for relevant states:

- Default.
- Hover (for pointer devices).
- Focus-visible.
- Pressed/active.
- Disabled.
- Loading.
- Success.
- Error.
- Empty, where applicable.

### 10.3 QR scanning states

The signature scan flow should have explicitly designed screens/states:

1. Ready to scan — explain what the user should scan.
2. Camera permission request or permission explanation.
3. Scanning — clear frame and concise instruction.
4. Verifying — prevent duplicate submissions and show progress.
5. Success — show the recorded attendance event and time.
6. Invalid/expired QR — explain why it could not be accepted where the system can safely provide that reason.
7. Already recorded — explain the existing state and next permitted action.
8. Network/offline failure — explain whether the event was recorded; never imply success when confirmation was not received.
9. Camera unavailable — provide a helpful recovery path if an alternative workflow exists.

The scan flow must reflect the actual server response and attendance rules. Do not infer success merely because a QR code was detected by the camera.

---

## 11. Accessibility and usability requirements

- Maintain sufficient text and component contrast.
- Use semantic headings in a logical order.
- Provide accessible names for icon-only buttons.
- Support keyboard navigation on the web.
- Make focus indicators visible.
- Associate form labels and validation messages with their fields.
- Announce important status changes to assistive technology where supported.
- Do not use color as the only indicator of attendance or leave status.
- Provide clear error messages and recovery instructions.
- Ensure touch targets are suitably large and spaced.
- Respect reduced-motion settings.
- Support browser zoom without loss of functionality.
- Check the interface in both light and any supported dark theme before release.

---

## 12. Technical implementation guidance

This is a design-system and interface redesign, not permission to rebuild or replace the existing application architecture.

### 12.1 Inspect before changing

Before implementing:

1. Inspect the repository structure and identify the web and mobile applications.
2. Confirm the frameworks, versions, routing approach, styling strategy, and component conventions.
3. Review existing pages, reusable components, APIs, database interactions, authentication, and authorization.
4. Identify the complete set of routes and role-specific workflows.
5. Identify the QR scanning implementation and determine which scanning modes are already supported.
6. Identify existing design tokens and brand assets.
7. Record any technical constraints before choosing implementation details.

Do not assume a particular stack or replace the current stack without a clear technical reason.

### 12.2 Organize design tokens centrally

Recommended conceptual organization (adapt names and directories to the current repository):

```text
design-system/
├── tokens/
│   ├── colors
│   ├── typography
│   ├── spacing
│   ├── radius
│   ├── shadows
│   └── motion
├── components/
│   ├── navigation
│   ├── cards
│   ├── forms
│   ├── tables
│   ├── status
│   └── feedback
└── layouts/
    ├── web-shell
    ├── mobile-shell
    └── responsive-patterns
```

This is a conceptual structure. Follow the actual repository conventions rather than creating an unnecessary duplicate framework.

### 12.3 Example CSS token foundation

```css
:root {
  /* Brand */
  --color-brand-primary: #587D70;
  --color-brand-deep: #42675B;
  --color-brand-dark: #2F4D43;
  --color-brand-soft: #E5EEEA;
  --color-brand-pale: #EFF4F1;

  /* Surfaces */
  --color-page: #F7F8F7;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F1F3F1;

  /* Text and borders */
  --color-text-primary: #242927;
  --color-text-secondary: #777F7B;
  --color-text-muted: #929A96;
  --color-border: #E9ECEA;

  /* Status */
  --color-success: #4E9875;
  --color-warning: #D6A34B;
  --color-danger: #D66B6B;
  --color-info: #648DB5;

  /* Shape and spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography */
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;

  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 220ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

Treat this as a starting point. Confirm typography loading, contrast, and platform-specific rendering before adopting it wholesale.

### 12.4 Preserve functional and data integrity

The redesign must not break:

- Login, logout, session handling, or account recovery.
- Existing routes and deep links.
- Role and permission enforcement.
- QR scanning and attendance validation.
- Check-in/check-out business rules.
- Attendance history and calculations.
- Leave balances, requests, approval workflows, and status transitions.
- Reports, exports, and filters.
- Notifications and existing integrations.
- Existing API contracts and database relationships.

Do not introduce static demonstration metrics into production pages. Use real data and show a proper empty/loading/error state when data is unavailable.

Do not move security checks into the frontend. Backend authorization and validation must remain authoritative.

---

## 13. Suggested screen inventory

Use this inventory to plan coverage. Include only the screens and features that exist in the current CheckedIn product or are explicitly approved for development.

### Shared / authentication

- Sign in.
- Registration or invitation acceptance, if supported.
- Password recovery, if supported.
- Account verification, if supported.
- Access denied.
- Not found.

### Individual user / participant

- Home dashboard.
- QR scan/check-in flow.
- Attendance history.
- Attendance calendar.
- Attendance record details.
- Leave overview.
- Leave request.
- Leave history/details.
- Profile.
- Settings.
- Notifications.

### Administrator / management roles

- Management dashboard.
- Attendance monitoring.
- Attendance record details or corrections, if authorized.
- People or user management.
- Group/class/team management, if supported.
- QR/session management, if supported.
- Leave request review and approvals, if supported.
- Reports and analytics.
- System settings.
- Role and permission management, if supported.

---

## 14. Implementation sequence

Implement the redesign in controlled stages to reduce regression risk.

### Phase 1 — Audit and baseline

- Inspect the current web and mobile projects.
- Inventory routes, roles, and core workflows.
- Identify shared components and duplicated styles.
- Record screenshots of existing key screens for regression comparison.
- Confirm current QR and attendance behavior.

**Deliverable:** a concise implementation map and list of affected screens/components.

### Phase 2 — Brand and tokens

- Confirm the existing CheckedIn logo and wordmark.
- Define the CheckedIn Mark treatment or adapt the existing symbol.
- Implement the shared color, typography, spacing, radius, shadow, and motion tokens.
- Define status colors and labels.

**Deliverable:** working visual foundations used by both platforms.

### Phase 3 — Shared components

- Implement buttons, inputs, cards, status badges, headers, navigation, and feedback components.
- Build the attendance record and metric card patterns.
- Build responsive table and form patterns.
- Verify accessibility and all interaction states.

**Deliverable:** reusable components ready for screen implementation.

### Phase 4 — Mobile experience

- Implement the mobile shell and bottom navigation.
- Redesign the home dashboard.
- Implement the scan/check-in visual flow around the existing functional workflow.
- Redesign attendance history and leave management.
- Redesign profile/settings and other existing mobile screens.

**Deliverable:** consistent mobile interface with functional attendance workflows.

### Phase 5 — Web experience

- Implement desktop sidebar and top bar.
- Redesign role-specific dashboards.
- Redesign attendance tables, calendars, reports, leave screens, and administrative screens.
- Add responsive tablet and small-screen behavior.

**Deliverable:** complete web interface using the same CheckedIn design system.

### Phase 6 — Testing and refinement

- Test each role and permission combination.
- Test the QR scan flow on supported devices and browsers.
- Verify forms, validation, tables, filters, and navigation.
- Test responsive widths and device safe areas.
- Check loading, empty, error, disabled, and success states.
- Compare key screens against the design specification.
- Fix functional regressions before visual polish is considered complete.

**Deliverable:** tested and consistent redesign with documented known limitations.

---

## 15. Quality assurance checklist

### Brand and visual consistency

- [ ] CheckedIn mark and wordmark are used consistently.
- [ ] The sage-green and neutral palette is applied through shared tokens.
- [ ] Typography hierarchy is consistent.
- [ ] Card padding and corner radii are consistent.
- [ ] Icon style and stroke weight are consistent.
- [ ] Shadows and borders are restrained.
- [ ] Status colors are consistent and always supported by labels.

### Web experience

- [ ] Sidebar navigation works for each role.
- [ ] Active routes and submenus are clear.
- [ ] Top bar is consistent across pages.
- [ ] Dashboard cards align correctly at supported widths.
- [ ] Tables support available search/filter/sort behavior.
- [ ] Table content remains usable on small screens.
- [ ] Forms have clear labels and validation.
- [ ] Charts and statistics use actual data.

### Mobile experience

- [ ] Bottom navigation respects device safe areas.
- [ ] Center scan action is functional and visually recognizable.
- [ ] Content does not hide behind bottom navigation.
- [ ] Important tap targets are large enough.
- [ ] Calendar dates are selectable and understandable.
- [ ] Attendance cards remain readable on narrow devices.
- [ ] Forms are easy to complete with the on-screen keyboard.
- [ ] QR scanning states and errors are understandable.

### Functionality and security

- [ ] Authentication still works.
- [ ] Existing routes and deep links still work.
- [ ] Backend permissions remain enforced.
- [ ] Attendance records are not duplicated by repeated taps.
- [ ] Check-in/check-out timestamps reflect actual server-confirmed events.
- [ ] Leave request rules and statuses are unchanged.
- [ ] No production metric is hardcoded or fabricated.
- [ ] Failure states do not falsely report successful actions.

### Accessibility and performance

- [ ] Keyboard navigation works on web.
- [ ] Focus indicators are visible.
- [ ] Contrast is sufficient.
- [ ] Icon-only controls have accessible names.
- [ ] Reduced-motion preferences are respected.
- [ ] Loading states avoid major layout shifts.
- [ ] No unintended horizontal overflow exists.

---

## 16. Definition of done

The redesign is complete only when:

1. The web and mobile applications share one coherent CheckedIn identity.
2. The CheckedIn brand mark and QR/check-in action are recognizable and consistently implemented.
3. Every existing screen included in scope follows the new design system.
4. Layouts are intentionally adapted for desktop, tablet, and mobile.
5. Dashboards are role-aware and display only authorized information.
6. Attendance, QR, leave, reporting, and account workflows continue to function.
7. Interactive controls have appropriate loading, disabled, success, and error states.
8. Data displayed in production comes from the actual system.
9. Accessibility, responsiveness, and functional regression checks have been completed.
10. No existing feature or permission rule has been removed merely to simplify the redesign.

---

## 17. Final direction

**CheckedIn should be recognized by three things:**

1. **The calm sage-green visual language** — warm, organized, and professional.
2. **The CheckedIn Mark** — a simple scan-frame and checkmark symbol representing verified presence.
3. **The signature scan action** — a prominent, practical QR interaction that makes attendance the center of the experience.

Use the supplied reference as the benchmark for visual restraint, card organization, calendar presentation, and mobile navigation. Build on it with a more complete desktop architecture, role-aware experiences, dependable status communication, and a reusable component system.

The final product should feel like one carefully designed platform across web and mobile: recognizable, accessible, efficient, and distinctly CheckedIn.
