# CheckedIn — UI Design Specification

## 1. Purpose

CheckedIn is a school event attendance and engagement platform composed of:

- A web application for Administrators, Faculty, and Organization Members
- A Flutter mobile application for Students
- Supabase-powered authentication, database, storage, realtime updates, and trusted Edge Functions

The UI must communicate two things simultaneously:

1. **Institutional reliability** — attendance, identity, security, monitoring, and reporting must feel official and trustworthy.
2. **Student engagement** — Bingo, badges, achievements, and points should feel rewarding without making the product look like a children's game.

The intended visual character is:

> **Institutional Minimalism + Editorial Information Design + Subtle Gamification**

The interface should look like a real university-developed system rather than a generic AI-generated SaaS dashboard.

---

## 2. Core Visual Principles

### 2.1 Clean

Use:

- White or very light neutral backgrounds
- Strong whitespace
- Clear alignment
- Thin borders
- Small or moderate corner radii
- Restrained shadows
- Simple icons
- High text contrast

Avoid:

- Glassmorphism
- Excessive gradients
- Neon colors
- Floating blobs
- Excessive glow effects
- Decorative 3D illustrations
- Excessive rounded containers

### 2.2 Organized

The system handles operational data, so information architecture must be obvious.

Every screen should establish:

1. Where the user is
2. What the page is for
3. What action is currently important
4. What information requires attention
5. What the next logical action is

### 2.3 Distinctive

CheckedIn should have its own visual language built around:

- Campus passes
- Event credentials
- QR codes
- Event stamps
- Achievement seals
- Numbered Bingo cells
- Institutional typography
- Event-specific identity

Do not use generic dashboard decoration as the source of uniqueness.

---

## 3. Recommended Design Tokens

### 3.1 Color Palette

Primary:

- Deep Navy: `#17324D`
- Dark Navy: `#0C2238`

Neutral:

- Background: `#F6F7F5`
- Surface: `#FFFFFF`
- Border: `#E2E5E7`
- Primary Text: `#202428`
- Secondary Text: `#697178`
- Disabled Text: `#A5ABB0`

Semantic:

- Success: muted green
- Warning: muted amber
- Error: muted red
- Information: muted blue

Gamification accent:

- Warm Gold / Amber

The exact values can be adjusted, but the palette must remain restrained.

### 3.2 Color Usage Rules

Use the primary navy for:

- Navigation
- Primary actions
- QR/event identity
- Important headings
- Selected states

Use gold/amber sparingly for:

- Bingo
- Rewards
- Achievement seals
- Completion moments

Use semantic colors only for actual system states.

Never use multiple saturated colors merely to make cards look interesting.

---

## 4. Typography

Recommended approach:

### Primary Typeface

Use a highly readable sans-serif such as:

- Inter
- Geist
- IBM Plex Sans

Use it for:

- Navigation
- Forms
- Tables
- Labels
- Buttons
- Statistics
- System messages

### Optional Editorial Typeface

A restrained serif such as:

- DM Serif Display
- Libre Baskerville

can be used for:

- Major event titles
- Section introductions
- Special achievement headings

Do not use decorative typography for normal system content.

### Typography Hierarchy

Desktop:

- Page title: 28–34 px
- Section title: 18–22 px
- Card title: 15–17 px
- Body: 14–15 px
- Supporting text: 12–13 px
- Metadata: 11–12 px

Mobile:

- Page title: 24–28 px
- Section title: 17–20 px
- Body: 14–16 px
- Metadata: 11–13 px

Use weight and spacing before increasing font size.

---

## 5. Shape Language

Use a restrained radius system:

- Small: 6 px
- Medium: 8 px
- Large: 12 px

Do not make every element a pill.

Pills should primarily represent:

- Status
- Filters
- Tabs
- Compact categories

Cards should generally use 8–12 px radii.

Buttons can use 7–9 px radii.

---

## 6. Spacing System

Use an 8-point spacing system:

- 4 px — micro spacing
- 8 px — icon/label spacing
- 12 px — compact spacing
- 16 px — normal internal spacing
- 24 px — card padding
- 32 px — section separation
- 40–48 px — major page separation
- 64 px+ — major layout breathing room

Maintain consistent spacing instead of manually positioning individual elements.

---

# 7. Web Application Structure

## 7.1 Global Shell

Desktop layout:

```text
┌──────────────┬───────────────────────────────────────────┐
│              │ Top bar                                  │
│   Sidebar    ├───────────────────────────────────────────┤
│              │                                           │
│              │ Main content                              │
│              │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

Sidebar:

- Width: approximately 230–250 px
- Dark navy background
- White logo/wordmark
- Clear navigation grouping
- Minimal active-state treatment
- User profile at bottom

Do not use oversized navigation pills.

The active navigation item should use:

- Slightly lighter navy surface
- Small left accent
- White text
- Clear icon

---

# 8. Admin UI

## 8.1 Admin Dashboard

The dashboard should prioritize operational awareness.

Header:

```text
Good morning, Administrator

Campus Event Overview
September 3, 2026
```

Primary KPI row:

- Today's Check-ins
- Active Events
- Total Students
- Bingo Completions

Each KPI should include:

- Label
- Large number
- Short contextual description
- Optional small trend indicator

Do not turn every KPI into a colorful graphic.

### Recent Events

Use a structured event list rather than a collection of decorative cards.

Each event row contains:

- Event image/identity
- Event name
- Short description
- Status
- Attendance progress
- Time/date

Example:

```text
CCS DAYS 2026
Technology • Community • Innovation

██████████████████░░  824 / 1000

LIVE
```

---

# 9. Event Management UI

The Event Details page should act as the operational control center.

Header:

```text
CCS Days 2026                         LIVE

Events > CCS Days 2026 > Check-in
```

Primary areas:

### Event Identity

Show:

- Event title
- Description
- Organization
- Date
- Time
- Venue
- Event ID

### Attendance Controls

Show:

- QR status
- QR code
- OTP status
- OTP rotation action
- Attendance start/end
- Geofence radius
- Event state

### Live Attendance

Show:

- Current check-ins
- Expected participants
- Attendance percentage
- Latest check-in
- Attendance-over-time chart

The QR area should look like a legitimate event credential, not merely a QR image placed inside a card.

---

# 10. QR Display UI

The QR screen should be highly focused.

```text
CCS DAYS 2026

STUDENT CHECK-IN

[ QR CODE ]

Scan to check in

Event ID      CCS-2026-014
Status        ACTIVE
Location      CCS Grounds
Radius        100 m
OTP Required  Yes
Expires       09:45 AM
```

The QR code must be large enough to scan comfortably.

Include:

- Event identity
- Current status
- Expiration
- Event ID
- Venue
- Geofence radius
- OTP requirement

If QR rotation is supported, show a clear countdown or refresh state.

---

# 11. Live Attendance Monitor

This screen is operational and should be table-driven.

Columns:

- Student
- Program
- Year
- Check-in time
- Distance
- Selfie status
- Attendance status

Example:

```text
Juan Dela Cruz    BSIT    3    09:41:18    32m    Verified
Maria Santos      BSCS    2    09:42:11    47m    Verified
Carlo Reyes       BSIT    1    09:44:02    19m    Verified
Angela Lopez      BSIT    2    09:46:21    84m    Pending
```

Provide:

- Search
- Program filter
- Year filter
- Status filter
- Export
- Pagination

Use Realtime updates without forcing the user to refresh.

---

# 12. Reports UI

Reports should feel like an administrative information system.

Primary filters:

- Event
- Date range
- Program
- Year level
- Attendance status
- Organization

Views:

- Attendance records
- Absentees
- Event summary
- Program comparison
- Year-level comparison

Provide export actions in a secondary position so that the main page remains readable.

---

# 13. Analytics UI

Analytics should focus on decisions rather than decoration.

Useful visualizations:

- Attendance over time
- Attendance by program
- Attendance by year level
- Event participation
- Repeat participation
- Bingo completion
- Reward distribution

Charts should use a restrained visual vocabulary.

Avoid dashboard walls containing six or more unrelated charts.

---

# 14. Organization Dashboard

Organization users should see only the controls relevant to their organization.

Primary navigation:

- Overview
- Events
- Attendance
- Bingo
- Badges
- Reports

The event creation action should be prominent.

The dashboard should emphasize:

- Organization events
- Current attendance
- Bingo progress
- Recent activity

Organization-specific events and Bingo cards should visually carry the organization's identity while remaining within the CheckedIn design system.

---

# 15. Faculty Dashboard

Faculty users are report-focused.

Do not expose event-creation controls.

Primary navigation:

- Overview
- Events
- Attendance
- Reports
- Analytics

The interface should make read-only access obvious.

Faculty should be able to quickly answer:

- Which events are active?
- How many students attended?
- Who was absent?
- Which programs participated?
- What are the attendance trends?

---

# 16. Student Mobile UI

The mobile app is the primary student experience.

Use bottom navigation:

```text
Home   Events   Bingo   Rewards   Profile
```

Keep the number of navigation items low.

---

# 17. Student Home

The home screen should immediately expose attendance and engagement.

Header:

```text
Good morning,
Briddon.
```

Primary component:

## Campus Pass

```text
┌───────────────────────────────┐
│ YOUR CAMPUS PASS              │
│                               │
│ SK BRIDDON DUMLAO             │
│ BSIT • 3rd Year       [ QR ]  │
│                               │
│ Tap to check in               │
└───────────────────────────────┘
```

Below it:

- Upcoming event
- Bingo progress
- Achievement count
- Recent attendance

The QR/campus pass should be one of the strongest visual elements on Home.

---

# 18. Student Event Discovery

Events should be divided into:

- Upcoming
- Ongoing
- Past

Each event item contains:

- Event identity
- Event title
- Date
- Time
- Venue
- Organization
- Status
- Attendance state

Example:

```text
CCS DAYS 2026
CCS Grounds
May 20, 2026 • 8:00 AM

LIVE
824 / 1000 checked in
```

Do not hide important information behind excessive interaction.

---

# 19. Event Details

The event details screen should answer:

1. What is the event?
2. When is it?
3. Where is it?
4. Who organized it?
5. Can I check in?
6. What verification is required?

Primary CTA:

```text
Scan QR to Check In
```

Secondary information:

- Date
- Time
- Venue
- Geofence radius
- OTP requirement
- Organization
- Description

---

# 20. Student QR Scanner

The scanner should be visually simple.

Structure:

```text
< Check-In

Scan the event QR code

Ask the organizer for the QR code.

┌─────────────────────┐
│                     │
│       QR AREA       │
│                     │
└─────────────────────┘

Align QR code within the frame
```

Provide:

- Flash
- Camera permission handling
- Scanning feedback
- Invalid QR feedback
- Expired QR feedback

Do not put unrelated content on the scanning screen.

---

# 21. Verification Flow

The verification UI must make the process transparent.

Sequence:

```text
QR Scan
   ↓
Event Validation
   ↓
Location Verification
   ↓
OTP (if required)
   ↓
Live Selfie
   ↓
Attendance Submission
   ↓
Success
```

Use a progress/step indicator.

Example:

```text
✓ Location
✓ OTP
● Selfie
○ Submit
```

The student should always know:

- What is being checked
- Why it is required
- What remains

---

# 22. GPS Verification UI

When location is checked:

```text
Checking your location

You must be within 100 meters
of CCS Grounds.

        ◉
     You are here

Distance: 42 meters

✓ Within attendance area
```

If outside:

```text
Outside attendance area

You are approximately 182 meters
from the event venue.

Move closer to CCS Grounds
and try again.
```

Never use vague errors such as:

> “Something went wrong.”

Explain the actual condition.

---

# 23. OTP UI

Use a dedicated six-digit OTP input.

```text
Enter event code

Enter the 6-digit code shown
by the event organizer.

[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]

Code expires in 00:45
```

Include:

- Clear error state
- Expiration state
- Resend/refresh behavior where applicable

---

# 24. Selfie Verification UI

The screen should emphasize that the camera must capture a live selfie.

```text
Selfie Verification

Take a live selfie to confirm
your attendance.

[ Camera Preview ]

Keep your face inside the frame.

[ Capture Selfie ]
```

Do not provide a gallery-upload option if the system requires a live capture.

Before submission, provide a preview and clear confirmation.

---

# 25. Attendance Success

Success should be calm and satisfying.

```text
✓

Attendance Recorded

CCS Days 2026

May 20, 2026 • 09:42 AM
CCS Grounds

+10 points
Bingo progress updated
```

If a Bingo cell was completed:

```text
Bingo cell completed
```

If an achievement was unlocked:

```text
Achievement unlocked
Event Regular
```

Use animation sparingly.

---

# 26. Bingo UI

Bingo is the main gamification surface.

It should feel like a modernized physical event stamp card.

Header:

```text
CCS DAYS 2026
EVENT BINGO

7 / 9 completed
```

Grid:

```text
┌────────┬────────┬────────┐
│   ✓    │   ✓    │   03   │
│ Attend │ Seminar│ Booths │
├────────┼────────┼────────┤
│   04   │   ✓    │   06   │
│Workshop│ 3 Check│  Game  │
├────────┼────────┼────────┤
│   07   │   08   │   ✓    │
│Concert │ Friend │ Closing│
└────────┴────────┴────────┘
```

Completed cells should use an event-stamp/seal treatment.

Avoid cartoon graphics.

---

# 27. Rewards and Achievements

Achievements should resemble official recognition seals.

Examples:

- First Check-in
- Event Regular
- Event Explorer
- Bingo Beginner
- Bingo Master
- 3-Event Streak

Display:

- Badge
- Name
- Requirement
- Unlock date
- Progress

Use gold sparingly.

---

# 28. Notifications

Notifications should be actionable.

Examples:

```text
CCS Days 2026 starts today
8:00 AM • CCS Grounds

Your Bingo card is 7/9 complete
Two activities remain.

Achievement unlocked
Event Regular
```

Avoid generic notification spam.

---

# 29. Profile

Profile should contain:

- Student name
- Student ID
- Program
- Year level
- Email
- Account status
- Attendance summary
- Points
- Achievements

Account actions:

- Edit permitted profile fields
- Terms
- Privacy
- Logout

---

# 30. Registration UI

Registration is a multi-step process.

Recommended flow:

```text
Student ID
   ↓
OCR Review
   ↓
Profile Confirmation
   ↓
Email
   ↓
Password
   ↓
Email OTP
   ↓
Pending Approval
```

Use a visible step indicator.

The OCR review screen should clearly distinguish:

- Information detected from the ID
- Information the student can edit
- Information that is locked or requires verification

---

# 31. Empty, Loading, and Error States

Every major page must have intentional states.

### Empty

Example:

```text
No upcoming events

There are no events available
for your program right now.
```

### Loading

Use skeletons for data-heavy pages.

Do not show excessive spinners.

### Error

Use specific messages.

Example:

```text
QR code expired

Ask the organizer to display
a new event QR code.
```

---

# 32. Accessibility

Required considerations:

- Strong text contrast
- Minimum comfortable touch target around 44 px
- Do not rely only on color to communicate status
- Visible focus states on web
- Readable text sizes
- Clear form labels
- Descriptive error messages
- Accessible icons
- Camera/location permission explanations

---

# 33. Responsive Behavior

Desktop:

- Persistent sidebar
- Multi-column dashboards
- Data tables
- Side-by-side monitoring panels

Tablet:

- Collapsible sidebar
- Reduced dashboard columns
- Responsive tables

Mobile:

- Bottom navigation
- Single-column layouts
- Large touch targets
- Full-width CTAs
- Simplified tables converted to cards

---

# 34. Component Library

Create reusable components:

### Navigation

- Sidebar
- Topbar
- Mobile bottom navigation
- Breadcrumbs

### Data

- KPI card
- Event row
- Attendance table
- Progress bar
- Status indicator
- Data filters
- Pagination

### Forms

- Text input
- Select
- Date picker
- Time picker
- OTP input
- Search field
- File/image capture state

### Event

- Event card
- Event header
- QR panel
- Event status
- Attendance progress

### Gamification

- Bingo cell
- Bingo card
- Achievement badge
- Reward counter
- Progress indicator

### Feedback

- Toast
- Alert
- Confirmation dialog
- Empty state
- Loading skeleton
- Success state

---

# 35. Figma Organization

Recommended Figma pages:

```text
00 — Cover
01 — Foundations
02 — Components
03 — Admin
04 — Faculty
05 — Organization
06 — Student Mobile
07 — Authentication
08 — Check-In Flow
09 — Bingo & Rewards
10 — Reports & Analytics
11 — Prototype Flows
12 — Responsive Variants
```

Use Auto Layout extensively.

Create variables for:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Component states

Build components before assembling final pages.

---

# 36. Final UI Character

The finished UI should feel:

- Trustworthy
- Academic
- Modern
- Calm
- Structured
- Slightly editorial
- Technically credible
- Rewarding without being childish

The design should communicate:

> **“This is the university's official event attendance system, and the gamification makes participation more engaging.”**

Not:

> **“This is a game that happens to track attendance.”**


# 37. Theme Adjustment and Dynamic Color System

CheckedIn should support a user-selectable visual theme that changes the **entire application color palette** while preserving the same layout, typography, spacing, component structure, and interaction patterns.

The theme system should be based on semantic design tokens rather than hard-coded colors.

## 37.1 Theme Selection

Add a **Theme** or **Appearance** section under Settings.

Recommended options:

```text
Appearance

System Default
○ Light
○ Dark

Color Theme

● Navy
○ Forest
○ Burgundy
○ Indigo
○ Slate
```

The exact theme names may be changed, but each option should represent a complete coordinated palette.

The selected theme must affect:

- Sidebar
- Navigation
- Buttons
- Links
- Active states
- Progress indicators
- Event accents
- Charts
- Form focus states
- Cards where accent color is used
- Bingo interface
- Achievement visuals
- Notifications
- Mobile navigation
- Empty states
- Status-adjacent decorative elements

It must not randomly recolor individual components.

## 37.2 Semantic Color Tokens

Define colors by purpose rather than by component.

Example token structure:

```text
--color-primary
--color-primary-strong
--color-primary-soft
--color-secondary
--color-accent
--color-background
--color-surface
--color-surface-muted
--color-border
--color-text
--color-text-muted
--color-success
--color-warning
--color-error
--color-info
```

A theme changes the values of these tokens.

Components continue using semantic tokens.

For example:

```text
Button → --color-primary
Sidebar → --color-primary-strong
Selected state → --color-primary-soft
Page background → --color-background
Card → --color-surface
Border → --color-border
```

This prevents theme changes from creating inconsistent interfaces.

## 37.3 Recommended Theme Families

### Navy — Default

The primary CheckedIn identity.

Character:

- Institutional
- Trustworthy
- Academic
- Professional

Use deep navy as the dominant accent.

### Forest

Character:

- Calm
- Natural
- Community-oriented

Use deep green as the primary color while retaining neutral surfaces.

### Burgundy

Character:

- Formal
- Traditional
- Academic

Use deep burgundy as the primary color.

### Indigo

Character:

- Contemporary
- Technical
- Modern

Use deep indigo as the primary color.

### Slate

Character:

- Neutral
- Minimal
- Administrative

Use charcoal/slate as the dominant accent.

These themes should not change the application's fundamental visual identity.

## 37.4 Light and Dark Modes

Theme selection should support both:

```text
Color Theme: Navy
Appearance: Light
```

and:

```text
Color Theme: Navy
Appearance: Dark
```

The dark version must use a deliberately designed dark palette rather than simply inverting colors.

Dark mode should use:

- Dark neutral background
- Elevated dark surfaces
- Adjusted border contrast
- Accessible primary text
- Muted secondary text
- Theme-specific accent
- Reduced visual intensity for large accent areas

Avoid pure black backgrounds.

## 37.5 Theme Preview

The Settings page should provide a live preview.

Example:

```text
COLOR THEME

┌──────────┐ ┌──────────┐ ┌──────────┐
│  Navy    │ │  Forest  │ │ Burgundy │
│  ████    │ │  ████    │ │  ████    │
│    ✓     │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘
```

Selecting a theme should update the preview immediately.

If appropriate, apply the theme immediately to the interface without requiring a Save button.

## 37.6 Persistence

The selected theme should persist between sessions.

For authenticated users, store the preference in the user's profile/settings data.

For unauthenticated pages, use local browser/device preferences where appropriate.

The web and mobile applications should use the same semantic theme definitions so that a student's selected theme feels consistent across supported interfaces.

## 37.7 Theme and Gamification

The Bingo and reward system should inherit the selected theme.

However, achievement gold should remain a controlled semantic accent where it represents an award.

For example:

```text
Theme: Forest

Primary → Forest Green
Navigation → Forest Green
Buttons → Forest Green
Bingo → Forest-derived accent
Achievement → Gold award accent
```

Do not allow a theme to make every reward element the same color.

Gamification needs hierarchy even when the user changes themes.

## 37.8 Charts and Analytics

Charts must use theme-aware tokens.

Do not hard-code chart colors.

Example:

```text
chart-primary
chart-secondary
chart-muted
chart-grid
chart-label
```

Dark mode must automatically provide appropriate chart contrast.

If multiple series are required, use a controlled palette generated from the selected theme.

## 37.9 Theme Accessibility

Every theme must pass the same accessibility standards.

A theme cannot be accepted simply because it looks attractive.

Check:

- Text/background contrast
- Button text contrast
- Link visibility
- Focus indicators
- Disabled-state readability
- Status visibility
- Chart distinguishability
- Dark-mode readability

Never change success/warning/error semantics simply to match a selected theme.

## 37.10 Theme Restrictions

Theme customization should not allow users to arbitrarily change every color.

Avoid a full color picker for normal users.

Instead, provide curated theme palettes.

This maintains:

- Brand consistency
- Accessibility
- Visual hierarchy
- Cross-platform consistency
- Professional appearance

Advanced custom branding can be reserved for future institutional/organization settings.
