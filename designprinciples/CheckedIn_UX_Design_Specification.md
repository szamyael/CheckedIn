# CheckedIn — UX Design Specification

## 1. UX Objective

CheckedIn combines school event attendance monitoring with gamified participation.

The UX must make the primary attendance task extremely clear while supporting the complete operational lifecycle:

```text
Account
  ↓
Event discovery
  ↓
QR scan
  ↓
Event validation
  ↓
GPS verification
  ↓
OTP verification when required
  ↓
Live selfie verification
  ↓
Server-side attendance validation
  ↓
Attendance record
  ↓
Points / achievements / Bingo progress
  ↓
Realtime staff monitoring
  ↓
Reports and analytics
```

The experience must minimize confusion at every verification step.

The student should never wonder:

- What do I do next?
- Why am I being asked for this?
- Did my attendance succeed?
- Did my Bingo progress update?

The staff user should never wonder:

- Is the event active?
- Who has checked in?
- Is attendance being updated live?
- Why was a check-in rejected?
- Which students/programs participated?

---

# 2. UX Principles

## 2.1 Attendance First

CheckedIn is fundamentally an attendance system.

Therefore:

1. Check-in must be easy to find.
2. The QR scanner must be one or two actions away.
3. Verification must be sequential.
4. Success must be explicit.
5. Attendance history must be easy to verify.

Gamification should enhance attendance, not obstruct it.

---

## 2.2 Progressive Disclosure

Do not expose every technical detail at once.

For students:

```text
Scan QR
↓
Check location
↓
Enter OTP if required
↓
Take selfie
↓
Submit
```

Only show the next requirement when the previous step succeeds.

For staff, expose more operational information because their job requires it.

---

## 2.3 Explain Verification

GPS, OTP, and selfie verification are potentially confusing.

Every verification step should explain:

- What is being checked
- Why it is required
- What the student should do
- What happens if it fails

Example:

> “Location verification confirms that you are physically within the event attendance area.”

This is better than simply displaying:

> “Location required.”

---

# 3. User Roles and UX Priorities

## Admin

Primary goal:

> Control and oversee the entire event attendance ecosystem.

Priorities:

1. Student approvals
2. Staff accounts
3. Organizations
4. Program alignment
5. Events
6. Bingo
7. Reports
8. Analytics
9. Notifications
10. System settings

Admin UX should prioritize breadth and control.

---

## Faculty

Primary goal:

> Monitor and analyze attendance without managing event creation.

Priorities:

1. Active events
2. Attendance
3. Absentees
4. Reports
5. Analytics

Do not expose organization/event creation actions.

---

## Organization Member

Primary goal:

> Run organization events and monitor participation.

Priorities:

1. Create event
2. Manage event
3. Display QR
4. Manage OTP
5. Monitor attendance
6. Manage Bingo
7. Manage badges
8. Review reports

---

## Student

Primary goal:

> Discover permitted events and complete verified attendance with minimal friction.

Priorities:

1. Upcoming events
2. Check-in
3. Attendance status
4. Bingo
5. Rewards
6. Achievements
7. Notifications

---

# 4. Information Architecture

## Web

```text
Dashboard
│
├── Events
│   ├── All Events
│   ├── Event Details
│   ├── Create Event
│   └── Check-in Control
│
├── Attendance
│   ├── Live Monitor
│   ├── Records
│   └── Absentees
│
├── Participants
│
├── Bingo & Rewards
│   ├── Bingo Cards
│   ├── Cells
│   ├── Badges
│   └── Student Progress
│
├── Reports
│
├── Analytics
│
├── Notifications
│
└── Settings
```

Admin adds:

```text
Organizations
Staff Accounts
Student Approvals
Program Alignment
Approvals
Audit / System Administration
```

---

## Mobile

```text
Home
Events
Bingo
Rewards
Profile
```

Authentication and check-in are task flows rather than permanent navigation destinations.

---

# 5. Student Onboarding UX

## Step 1 — Student ID Capture

The user sees:

```text
Create your CheckedIn account

We'll use your student ID
to verify your student information.

[ Scan Student ID ]
```

Provide camera guidance.

Do not ask for unnecessary information before ID processing.

---

## Step 2 — OCR Processing

Show a short processing state:

```text
Reading student ID...

Extracting student information
```

Avoid technical OCR terminology where unnecessary.

---

## Step 3 — Review Information

Display extracted information in an editable review form.

Clearly distinguish:

- Detected information
- Editable fields
- Required fields

Example:

```text
Student ID     0XXX-XXXX
Name           Briddon Dumlao
Program        BSIT

Email
[________________]

Confirm information
```

---

## Step 4 — Password

Provide normal password creation UX:

- Password visibility toggle
- Requirements
- Strength indicator
- Confirmation

---

## Step 5 — Email Verification

Explain the reason:

> “We sent a verification code to your email.”

Provide:

- Six-digit input
- Countdown
- Resend action
- Invalid code state

---

## Step 6 — Pending Approval

Do not leave the student uncertain.

Show:

```text
Account submitted

Your student account is waiting
for administrator approval.

We'll notify you when access is ready.
```

---

# 6. Login UX

Student login should support:

```text
Student ID
Password

[ Sign In ]

Forgot password?
```

Keep login focused.

Do not require email if the specified system uses Student ID + password.

---

# 7. Password Recovery UX

Follow the defined flow:

```text
Student ID
↓
Resolve registered email
↓
Verification code
↓
New password
↓
Success
```

The UI should not expose whether an unrelated student ID exists in a way that leaks sensitive account information.

---

# 8. Home UX

Home should be a decision screen.

Within a few seconds, the student should understand:

- Do I have an event now?
- Can I check in?
- How is my Bingo progress?
- What have I recently accomplished?

Recommended order:

1. Greeting
2. Campus pass / quick check-in
3. Current or next event
4. Bingo progress
5. Achievements
6. Recent attendance

---

# 9. Event Discovery UX

Use three states:

### Upcoming

Events the student can attend later.

### Ongoing

Events currently available.

### Past

Previously completed or missed events.

The system must respect visibility rules.

Global admin events are visible to all students.

Organization events are visible only when the student's program is mapped to the organization.

The same rule applies to organization Bingo cards.

---

# 10. Check-In UX

## Primary Flow

```text
Event
 ↓
Scan QR
 ↓
Metadata validation
 ↓
Location
 ↓
OTP if required
 ↓
Selfie
 ↓
Submit
 ↓
Success
```

This flow should never feel like one large form.

Each step should have one primary purpose.

---

# 11. QR Scanning UX

Before opening the camera, explain:

> “Scan the QR code displayed by the event organizer.”

When scanning:

- Center QR detection area
- Give immediate scan feedback
- Do not require manual submission after successful detection unless needed
- Automatically continue when valid

If invalid:

```text
QR code not recognized

Make sure you're scanning the
CheckedIn QR code for this event.
```

If expired:

```text
This QR code has expired.

Ask the organizer to display
the current event QR code.
```

If already checked in:

```text
You're already checked in.

Checked in at 09:42 AM.
```

---

# 12. Event Validation UX

After scanning, briefly show event identity:

```text
CCS Days 2026
CCS Grounds

Attendance window:
8:00 AM – 5:00 PM

Continue
```

This protects against students accidentally scanning the wrong event.

---

# 13. GPS UX

Request location permission at the moment it becomes necessary.

Before permission:

> “CheckedIn uses your location to confirm that you are at the event venue.”

After obtaining location:

```text
Verifying location
```

Then:

### Success

```text
✓ You're within the event area
42 meters from venue
```

### Failure

```text
You're outside the attendance area

Current distance: 182 m
Required radius: 100 m

Move closer to the event venue.
```

Provide a retry action.

---

# 14. OTP UX

Only show OTP when the event requires it.

Do not make every student think OTP is always required.

Use a six-digit field with automatic focus movement.

After submission:

- Show immediate validation
- Preserve entered digits if the error is temporary
- Clear the field if security requires it
- Show remaining validity time

Expired:

```text
This code has expired.
Ask the organizer for the current code.
```

---

# 15. Selfie UX

Selfie verification should feel deliberate but quick.

Before camera:

```text
Live selfie required

Take a photo of yourself now.
Gallery photos cannot be used.

Continue
```

During capture:

- Face framing guide
- Neutral camera preview
- Short instruction
- Capture button

After capture:

```text
Use this selfie?

[ Retake ]     [ Continue ]
```

The UX should not encourage repeated unnecessary captures.

---

# 16. Submission UX

When the student submits attendance:

```text
Verifying attendance...

Checking:
✓ Event
✓ Time
✓ Location
✓ OTP
✓ Selfie
✓ Duplicate status
```

Do not expose sensitive technical implementation details.

The visible checklist can be simplified to user-understandable terms.

---

# 17. Attendance Success UX

Success is a major emotional moment.

Use:

```text
Attendance Recorded

CCS Days 2026
09:42 AM

You're officially checked in.

+10 points
```

Then show any gamification result:

```text
Bingo completed
“Attend Opening Program”

Achievement unlocked
“Event Regular”
```

The user should not need to navigate elsewhere to understand the result.

---

# 18. Checkout UX

Checkout should be much faster than check-in.

Flow:

```text
Scan QR
↓
Confirm event
↓
Checkout recorded
```

No OTP or selfie is required according to the system flow.

Show:

```text
Checkout Recorded

Checked out at 4:38 PM
```

---

# 19. Offline UX

The mobile app supports limited offline attendance capture.

The UX must clearly distinguish:

### Online

```text
✓ Synced
```

### Offline

```text
Offline mode
Attendance will sync automatically
when connection returns.
```

### Queued

```text
Attendance saved locally
Waiting to sync
```

### Synced

```text
✓ Attendance synced
```

Never falsely tell the student that server-side attendance is confirmed while the record is only locally queued.

---

# 20. Bingo UX

Bingo should reinforce attendance.

The relationship should be obvious:

```text
Attend Event
↓
Attendance confirmed
↓
Bingo cell completed
↓
Line/streak detected
↓
Badge/points awarded
```

Students should not manually claim a Bingo reward when the attendance system can determine completion automatically.

---

# 21. Bingo Card Interaction

Each cell should communicate:

- Number
- Activity/event
- State
- Completion

States:

### Locked

The activity has not been completed.

### Available

The activity is currently possible.

### Completed

The student attended the associated event.

### Rewarded

The completion contributed to a line/streak reward.

Use visual differences plus text/icon labels, not color alone.

---

# 22. Bingo Completion UX

When a cell completes:

1. Update the cell
2. Briefly animate it
3. Update progress
4. Check for completed line
5. If line completed, show reward
6. Update badge/points

Example:

```text
Cell completed!

7 / 9 complete
```

If a line is completed:

```text
Bingo line complete!

+25 points
Badge unlocked:
Bingo Beginner
```

Keep the celebration short.

---

# 23. Rewards UX

Points should always have a reason.

Example:

```text
+10
Event attendance
```

rather than:

```text
+10 points
```

Reward history can show:

- Date
- Event
- Action
- Points

This creates transparency.

---

# 24. Achievement UX

Achievement requirements should be understandable before unlocking.

Example:

```text
EVENT REGULAR

Attend 5 school events

4 / 5 completed
```

After unlocking:

```text
✓ EVENT REGULAR

Unlocked Aug 20, 2026
```

---

# 25. Notification UX

Notifications should help users act.

Categories:

- Event reminders
- Attendance results
- Bingo progress
- Achievement unlocks
- Account status
- System announcements

Use priority levels.

Do not make every event notification equally prominent.

---

# 26. Staff Event Creation UX

Event creation should be a structured form.

Recommended sections:

### Basic Information

- Event title
- Description
- Organization

### Schedule

- Date
- Start time
- End time

### Venue

- Venue name
- Latitude
- Longitude
- Radius

### Attendance Security

- OTP enabled/disabled
- Attendance window
- QR settings

### Publishing

- Draft
- Published
- Archived

Show a summary before final creation.

---

# 27. QR and OTP Management UX

The organization member should be able to:

- Display QR
- Rotate QR
- Generate OTP
- Refresh OTP
- View expiration
- Disable/enable attendance

Dangerous actions should require confirmation.

Example:

```text
Rotate event QR?

The current QR code will immediately
become invalid.

[ Cancel ] [ Rotate QR ]
```

---

# 28. Live Monitoring UX

The live monitor should behave like an operational console.

When a student checks in:

1. New record appears
2. Attendance count increments
3. Progress updates
4. Event statistics update
5. Charts update where applicable

The user should not need to refresh.

Provide a subtle “Live” indicator.

---

# 29. Attendance Review UX

Staff should be able to investigate individual records.

Student record detail can show:

- Student identity
- Event
- Check-in time
- Checkout time
- Attendance status
- Distance from venue
- Selfie verification status

Sensitive selfie access should only be available to authorized staff.

---

# 30. Reports UX

Reports should follow:

```text
Select filters
↓
Review results
↓
Inspect records
↓
Export
```

Do not force users through multiple pages for simple filtering.

Use persistent filters on desktop.

---

# 31. Analytics UX

Analytics should support comparison.

Useful questions:

- Which event had the highest attendance?
- Which program participated most?
- What year level had the most absences?
- How many students repeatedly attend?
- How many Bingo cards are being completed?

Each chart should answer a question.

Do not add charts merely because a dashboard has empty space.

---

# 32. Admin Approval UX

Student approval should show enough information to make a decision:

```text
Pending Student

Student ID
Name
Program
Email
OCR status
Email verification
Submission date

[ View ] [ Approve ] [ Reject ]
```

Destructive/rejection actions should request a reason where appropriate.

---

# 33. Organization Program Alignment UX

Use a simple mapping workflow:

```text
Organization
[ College of Computer Studies ]

Program
[ BS Information Technology ]

[ Add Mapping ]
```

Below:

```text
College of Computer Studies
BS Information Technology       Active
BS Computer Science             Active
```

Allow edit/delete.

Explain that this mapping controls visibility of organization events and Bingo cards.

---

# 34. Error Recovery

Errors must tell users what to do.

Bad:

> Verification failed.

Good:

> Your location is outside the event's 100-meter attendance area. Move closer to the venue and try again.

Bad:

> Invalid request.

Good:

> This event is no longer accepting check-ins.

Every recoverable error should provide a next action.

---

# 35. Permission UX

Request permissions contextually.

### Camera

Explain before request:

> “Camera access is needed to scan event QR codes and capture your live attendance selfie.”

### Location

Explain:

> “Location access confirms that you are physically at the event venue.”

If permission is denied:

- Explain consequence
- Provide retry
- Provide settings guidance where appropriate

---

# 36. Trust and Privacy UX

The system handles:

- Student identity
- Student IDs
- Location
- Selfies
- Attendance history

Therefore, privacy messaging must be visible but not intrusive.

Use short explanations near sensitive actions.

Example:

> “Your selfie is used only for attendance verification and is stored securely.”

Avoid displaying sensitive information unnecessarily.

---

# 37. Role-Based UX

Do not merely hide unauthorized buttons.

The whole interface should adapt to the user's role.

### Admin

Broad system navigation.

### Faculty

Reports and monitoring.

### Organization

Event and organization management.

### Student

Attendance and engagement.

This prevents users from feeling overwhelmed by irrelevant functionality.

---

# 38. UX State Model

Every major feature should have states.

## Event

```text
Draft
↓
Published
↓
Upcoming
↓
Live
↓
Ended
↓
Archived
```

## Attendance

```text
Not Started
↓
QR Scanned
↓
Location Verified
↓
OTP Verified
↓
Selfie Captured
↓
Submitting
↓
Checked In / Late / Rejected
↓
Checked Out
```

## Bingo Cell

```text
Locked
↓
Available
↓
Completed
↓
Line Completed
↓
Rewarded
```

## Account

```text
Pending
↓
Email Verified
↓
Approved
↓
Active
```

These states should be reflected consistently in the UI.

---

# 39. UX Consistency Rules

The same concept must always look and behave the same.

For example:

### “Live”

Always use the same status treatment.

### “Verified”

Always use the same icon + label.

### “Check In”

Always use the same primary-action wording.

### “Bingo”

Always use the same grid and cell terminology.

### “Event”

Always display title, date, time, venue, and status in predictable locations.

---

# 40. Mobile Navigation Behavior

The bottom navigation should remain stable.

```text
Home
Events
Bingo
Rewards
Profile
```

Do not move navigation items based on the current page.

Check-in is a task launched from:

- Home
- Event details
- Campus pass

---

# 41. Critical User Journeys

## Journey A — Student Check-In

```text
Open app
↓
Home
↓
Tap current event / Campus Pass
↓
Scan QR
↓
Confirm event
↓
Location verified
↓
OTP if required
↓
Live selfie
↓
Submit
↓
Attendance recorded
↓
Points/Bingo/achievement update
```

Target experience:

> Fast, transparent, predictable.

---

## Journey B — Student Bingo

```text
Open Bingo
↓
View card
↓
Select incomplete cell
↓
View associated event
↓
Attend event
↓
Check in
↓
Cell automatically completes
↓
Progress updates
↓
Reward if line/streak completed
```

The student should understand that attendance drives Bingo.

---

## Journey C — Organization Event

```text
Organization dashboard
↓
Events
↓
Create event
↓
Enter details
↓
Set venue/geofence
↓
Configure OTP
↓
Publish
↓
Display QR
↓
Monitor live attendance
↓
Review report
```

---

## Journey D — Admin Student Approval

```text
Admin dashboard
↓
Student approvals
↓
Open pending student
↓
Review identity
↓
Review verification
↓
Approve
↓
Student becomes active
```

---

## Journey E — Faculty Attendance Review

```text
Faculty dashboard
↓
Attendance
↓
Select event
↓
Filter program/year
↓
Review attendance
↓
Review absentees
↓
Export report
```

---

# 42. UX Writing

Use short, direct language.

Prefer:

> “Scan event QR”

over:

> “Click here to proceed with the QR code attendance verification process.”

Prefer:

> “You're outside the attendance area.”

over:

> “Geolocation validation has failed.”

Prefer:

> “Attendance recorded.”

over:

> “Attendance transaction successfully completed.”

The interface should sound like a university system, not a technical API.

---

# 43. UX Anti-Patterns to Avoid

Do not:

- Put five competing primary buttons on one screen
- Use excessive modals
- Hide important attendance information
- Require students to manually update Bingo
- Make QR scanning difficult to access
- Show technical backend errors
- Use color alone for status
- Force unnecessary profile information
- Make staff refresh live monitoring manually
- Put analytics before operational information
- Use gamification on every screen
- Make every component visually identical

---

# 44. Usability Testing Plan

Test the following tasks with representative users.

## Student Tasks

1. Register using Student ID
2. Verify email
3. Find an upcoming event
4. Check in using QR
5. Complete GPS verification
6. Enter OTP
7. Capture selfie
8. Confirm attendance
9. Find Bingo progress
10. Identify a remaining Bingo activity
11. View achievement
12. Review attendance history

Success criteria:

- User completes task without assistance
- User understands each verification step
- User can tell whether attendance succeeded
- User can find Bingo progress quickly

---

## Organization Tasks

1. Create event
2. Configure geofence
3. Enable OTP
4. Display QR
5. Rotate QR
6. Monitor attendance
7. Create Bingo card
8. Review progress
9. Generate report

---

## Faculty Tasks

1. Find active event
2. Open live attendance
3. Filter students
4. Find absentees
5. Compare programs
6. Export report

---

## Admin Tasks

1. Create organization
2. Create staff account
3. Approve student
4. Map program to organization
5. Review event
6. Review Bingo
7. Review analytics
8. Manage settings

---

# 45. UX Quality Checklist

Before considering a screen complete, verify:

### Clarity

- Is the purpose obvious?
- Is the primary action obvious?
- Are labels understandable?

### Efficiency

- Can the task be completed in the minimum reasonable number of steps?
- Are repeated actions minimized?

### Feedback

- Does every important action provide feedback?
- Does the user know whether the operation succeeded?

### Error Recovery

- Does every common error explain what happened?
- Is there a clear recovery action?

### Consistency

- Are components reused?
- Are terminology and status labels consistent?

### Trust

- Are security-sensitive actions explained?
- Are privacy expectations clear?

### Accessibility

- Is text readable?
- Are touch targets large enough?
- Is color not the only status indicator?

### Gamification

- Does Bingo reinforce attendance?
- Are rewards understandable?
- Does gamification remain secondary to the core task?

---

# 46. Final UX Direction

The ideal CheckedIn experience is:

> **Operationally serious, visually calm, and quietly rewarding.**

Students should feel:

> “Checking in is easy, and participating gives me something extra.”

Staff should feel:

> “I can immediately see what is happening.”

Administrators should feel:

> “The system is structured, controlled, and auditable.”

The strongest UX principle for the entire product is:

```text
MAKE ATTENDANCE SIMPLE.
MAKE VERIFICATION TRANSPARENT.
MAKE MONITORING IMMEDIATE.
MAKE GAMIFICATION MEANINGFUL.
```


# 46. Theme Adjustment UX

CheckedIn should provide a user-facing theme customization feature that allows users to change the system's overall color palette without changing its information architecture or interaction model.

The principle is:

> **Personalize the appearance, not the usability.**

A theme change should feel immediate, predictable, and reversible.

## 46.1 Theme Settings Location

Place theme controls under:

```text
Settings
└── Appearance
    ├── Theme Mode
    └── Color Theme
```

For mobile:

```text
Profile
└── Settings
    └── Appearance
```

Do not place theme controls inside event, attendance, or Bingo screens.

## 46.2 Appearance Options

Provide:

```text
Theme Mode

○ Light
○ Dark
○ System
```

And:

```text
Color Theme

● Navy
○ Forest
○ Burgundy
○ Indigo
○ Slate
```

The default should be the CheckedIn institutional theme.

## 46.3 Immediate Preview

Theme changes should preview immediately.

Interaction:

```text
User taps Forest
        ↓
Interface changes to Forest
        ↓
User evaluates appearance
        ↓
Selection persists automatically
```

Avoid making the user:

```text
Select theme
↓
Save
↓
Reload
```

unless the platform requires it.

Immediate feedback reduces uncertainty.

## 46.4 Preserve Layout

Changing themes must never:

- Move navigation
- Change button positions
- Change page hierarchy
- Remove information
- Change event visibility
- Change permissions
- Change attendance logic
- Change Bingo rules

Only visual styling changes.

This distinction is important because the user should not have to relearn the application after changing themes.

## 46.5 Theme Preview Card

The Settings page should include a miniature interface preview.

Example:

```text
Appearance

Color Theme

┌─────────────────────────────────┐
│  CHECKEDIN              ● LIVE  │
│                                 │
│  Today's Attendance             │
│  1,248                           │
│                                 │
│  ███████████████░░               │
│                                 │
│  [ View Events ]                 │
└─────────────────────────────────┘
```

When the user changes themes, this preview updates.

The preview should demonstrate:

- Primary color
- Surface
- Text
- Button
- Status
- Progress indicator

## 46.6 Theme Selection Feedback

The selected theme should be clearly identified.

Use:

- Checkmark
- Selected border
- Theme name
- Small palette preview

Do not rely solely on a colored swatch.

Example:

```text
✓ Navy
  Institutional
```

This also makes the selection understandable for users with color-vision deficiencies.

## 46.7 Theme Switching Behavior

The transition should be subtle.

Recommended:

- 150–250 ms color transition for major surfaces
- Avoid full-page animation
- Avoid screen reload
- Avoid navigation reset

Do not animate every component individually.

The goal is to make the interface feel like it changed naturally.

## 46.8 Light/Dark Interaction

Theme mode and color theme are separate settings.

For example:

```text
Color Theme: Burgundy
Mode: Dark
```

should produce a dark Burgundy interface.

Likewise:

```text
Color Theme: Forest
Mode: Light
```

should produce a light Forest interface.

The system should combine these settings using the semantic token system.

## 46.9 System Default

If the user selects:

```text
System
```

CheckedIn follows the operating system/browser preference.

If the operating system switches from light to dark, CheckedIn should follow automatically.

The user can override this by explicitly selecting Light or Dark.

## 46.10 Persistence

Once selected:

```text
Theme → stored
Mode → stored
```

On the next session:

```text
Open CheckedIn
↓
Load saved appearance preferences
↓
Apply theme
↓
Render interface
```

The user should not see the default theme flash for an extended period before the saved theme loads.

## 46.11 Cross-Platform Consistency

If the same user accesses:

- Web
- Mobile

the visual language should remain recognizable.

The exact component implementation can differ due to platform conventions, but:

- Primary color
- Accent
- Status semantics
- Bingo palette
- Achievement treatment

should remain consistent.

## 46.12 Theme and Role

Theme preferences are personal presentation settings.

Changing the theme must not alter role permissions.

For example:

```text
Admin + Forest
```

still has Admin permissions.

```text
Student + Burgundy
```

still has Student permissions.

The theme is not an access-control mechanism.

## 46.13 Theme and Event Branding

Event branding should remain subordinate to the user's selected system theme unless the event deliberately uses an event-specific image or identity.

Example:

```text
User Theme: Forest
Event: CCS Days 2026
```

The event can retain its CCS Days artwork while the surrounding application uses Forest.

Do not allow event colors to unexpectedly recolor the entire application.

## 46.14 Theme and Accessibility

Every theme must be tested independently.

A visually attractive palette is not sufficient.

Before publishing a theme, verify:

- Normal text contrast
- Large text contrast
- Interactive control contrast
- Focus indicator visibility
- Link visibility
- Disabled-state readability
- Chart readability
- Bingo state distinction
- Dark-mode readability

Success, warning, and error states must retain their semantic meaning.

## 46.15 Theme Failure and Fallback

If a saved theme becomes unavailable after an application update:

```text
Saved theme unavailable
        ↓
Fallback to CheckedIn Navy
        ↓
Continue normally
```

Do not block application access because of a visual preference.

## 46.16 UX Rules

The theme system should follow these rules:

1. One selection should change the whole palette.
2. Theme changes should be immediate.
3. The selected theme should persist.
4. Layout and navigation must remain unchanged.
5. Accessibility must remain consistent.
6. Status colors retain their semantic meaning.
7. Gamification inherits the theme without losing hierarchy.
8. Event-specific artwork remains independent.
9. Users choose from curated palettes rather than arbitrary colors.
10. The default CheckedIn theme remains the strongest institutional option.

---

# 47. Theme User Journey

```text
Student opens Profile
        ↓
Settings
        ↓
Appearance
        ↓
Selects Color Theme
        ↓
Chooses Forest
        ↓
Entire interface changes palette
        ↓
Student returns to Home
        ↓
Home uses Forest theme
        ↓
Events use Forest theme
        ↓
Bingo uses Forest-derived palette
        ↓
Rewards use Forest-derived palette
        ↓
Attendance screens use Forest theme
```

The user should experience this as one global preference rather than a collection of separate visual changes.

---

# 48. Recommended Theme UX Matrix

| Setting | Options | Scope |
|---|---|---|
| Mode | Light / Dark / System | Entire interface |
| Color Theme | Navy / Forest / Burgundy / Indigo / Slate | Entire interface |
| Event Artwork | Event-defined | Event-specific |
| Status Colors | System-defined | Global semantic meaning |
| Achievement Accent | Theme-aware + award gold | Rewards |
| Bingo Accent | Theme-aware | Gamification |

Do not expose independent controls for:

- Button color
- Sidebar color
- Card color
- Text color
- Chart color

Those should be derived automatically from the selected theme.
