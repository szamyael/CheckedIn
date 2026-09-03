# CheckedIn System Overview

CheckedIn is a QR-based event attendance platform. It provides web dashboards for administrators, faculty, and organization accounts, plus a Flutter mobile app for students. The system combines QR event identification, GPS geofencing, optional OTP verification, live selfie verification, attendance records, rewards, Bingo cards, reporting, and role-based access control.

## 1. System Architecture

```text
CHECKEDIN/
├── apps/
│   ├── web/       Next.js web application
│   └── mobile/    Flutter student application
├── backend/
│   └── supabase/  Database, Auth, Storage, Edge Functions, migrations
├── packages/
│   ├── shared_constants/
│   ├── shared_models/
│   └── shared_validation/
└── docs/
```

### Web application

The Next.js application provides authenticated dashboards and browser-based student pages. It uses Supabase SSR authentication on server-rendered pages and a browser Supabase client for interactive operations and Realtime subscriptions.

### Mobile application

The Flutter application is the primary student experience. It supports student registration, authentication, event discovery, QR scanning, GPS verification, OTP entry, selfie capture, attendance history, notifications, rewards, Bingo progress, profile management, and offline attendance capture.

### Supabase backend

Supabase provides:

- PostgreSQL tables and relationships
- Supabase Auth sessions and email verification
- Row Level Security (RLS)
- Private Storage buckets for student IDs and selfies
- Edge Functions for trusted workflows
- Realtime database change subscriptions
- Database functions, triggers, indexes, and migrations

## 2. User Roles

| Role | Main platform | Main capabilities |
| --- | --- | --- |
| Admin | Web | Manage accounts, organizations, events, mappings, settings, reports, analytics, approvals, notifications, and system data |
| Faculty | Web | View events, attendance reports, live monitoring, and analytics; faculty accounts do not create events |
| Organization member | Web | Create organization events, generate QR and OTP controls, manage Bingo cards and badges, and monitor organization attendance |
| Student | Mobile and browser student pages | Register, log in, view permitted events and Bingo cards, scan event QR codes, verify location, enter OTP, submit selfies, and track attendance and rewards |

## 3. Authentication and Account Lifecycle

### Staff accounts

1. An admin creates a faculty or organization member account.
2. The account is created in Supabase Auth.
3. A matching `users` row stores the role and account status.
4. A matching `staff_profiles` row stores the name, department, and optional organization ID.
5. Organization members must be linked to an organization before they can create organization events.
6. The staff member signs in through the web application.

### Student accounts

1. The student scans or captures a physical student ID.
2. The system sends the image to the student ID scanning Edge Function.
3. Veryfi OCR extracts the student ID, name, and program.
4. The student confirms or edits allowed profile fields and provides an email address.
5. The system validates the student ID format and OCR information.
6. The student creates a password.
7. The student account is created with pending status.
8. The student verifies the email using a Supabase OTP code.
9. An admin approves the student account.
10. The student signs in using student ID and password.

### Password recovery

1. The student scans their ID.
2. The system resolves the student ID to the registered email.
3. A verification code is sent by email.
4. The student enters the code and chooses a new password.

## 4. Event Creation and Publishing Flow

### Admin events

1. An admin opens the Events page.
2. The admin enters the event title, description, venue, location, attendance schedule, radius, and optional OTP settings.
3. The event is stored with the admin as `created_by`.
4. Published admin events are global student events and can be seen by all students.
5. The event can be used to generate a QR code for attendance.

### Organization events

1. An organization member opens the Events page.
2. The system loads the organization ID from the member's `staff_profiles` row.
3. The member creates an event with the organization ID and their user ID.
4. The event is associated with that organization.
5. Organization members can manage their own organization's events.
6. Students see the event only when their program is mapped to that organization.
7. The organization event can be published immediately according to the current event policy.

### Event controls

Staff can use event controls to:

- Display an attendance QR code
- Generate or refresh an attendance OTP
- Rotate an event QR token
- Configure attendance start and end times
- Set a geofence radius
- Review event status
- Edit or manage permitted events

## 5. Organization and Program Alignment

The `organization_programs` table links a student program or course to an organization.

```text
Student program: BS Information Technology
        |
        +--> College of Computer Studies
        +--> Other mapped organizations, if applicable
```

### Admin mapping flow

1. The admin opens Organization Program Alignment.
2. The organization dropdown lists available organizations.
3. The program/course dropdown lists existing programs found in student profiles.
4. The admin selects both values and adds the mapping.
5. The API upserts the organization-program pair.
6. The admin can edit or delete mappings.
7. The mapping remains persisted after a page refresh.
8. Program comparisons are normalized for trimming and case differences.

### Visibility effect

- Published admin events are visible to all students.
- Published organization events are visible only to students whose program maps to that organization.
- Active admin Bingo cards are visible to all students.
- Active organization Bingo cards are visible only to students whose program maps to that organization.
- A student can map to more than one organization when the same program is aligned to multiple organizations.

## 6. Student Attendance Flow

The attendance flow is available in the mobile app and browser student pages.

```text
Scan QR
   |
   v
Load event metadata
   |
   +--> Already checked out? -> Show checkout result
   |
   v
Verify GPS location
   |
   +--> Outside geofence -> Stop and show error
   |
   v
Enter OTP when required
   |
   v
Capture live selfie
   |
   v
Upload selfie to private Storage
   |
   v
Invoke check-in Edge Function
   |
   v
Validate event, time, location, OTP, selfie, and duplicate status
   |
   v
Create attendance record
   |
   v
Award points and Bingo or achievement progress
```

### Step 1: QR scan

The student scans the event QR code. The QR token is sent to the `event-check-in-meta` Edge Function, which returns event details and whether OTP is required.

### Step 2: Location verification

The student grants location permission. The system verifies that the device is within the event's configured radius using the event coordinates and the Haversine distance calculation.

### Step 3: OTP verification

If enabled, the student enters the current event OTP. The check-in service validates the code and its expiration window.

### Step 4: Selfie verification

The student captures a live camera frame. The selfie is uploaded to the private `selfies` bucket using this path format:

```text
{authenticated-user-id}/{timestamp}.jpg
```

The browser and mobile clients use insert-only uploads. Storage RLS permits a student to upload only into their own user-ID folder. Staff roles can read selfies for reports and monitoring.

The system also checks capture integrity and can block suspected screenshots or screen recordings.

### Step 5: Server-side check-in

The `check-in` Edge Function:

- Authenticates the request
- Confirms the account is active and is a student
- Validates required fields and coordinates
- Confirms the selfie belongs to the authenticated student
- Downloads and validates the selfie
- Verifies the QR token and event
- Checks the attendance time window
- Validates OTP when required
- Verifies the geofence distance
- Prevents duplicate check-ins
- Creates the attendance record
- Assigns checked-in or late status
- Awards reward points
- Applies achievements and Bingo progress

### Checkout

A student scans the same event QR code after checking in. When the event permits checkout, the `check-out` Edge Function records the checkout. Checkout does not require another OTP or selfie.

## 7. Offline Mobile Attendance

After one successful online login, the mobile app can support limited offline use.

Offline capabilities include:

- Local session unlock using the device's stored credentials
- Cached home statistics, events, profile, attendance history, and notifications
- Local attendance capture with GPS and selfie
- Local queueing of attendance submissions
- Automatic synchronization when connectivity and a valid online session return
- Synchronization of attendance captured during the valid event window
- Up to seven days of offline synchronization grace after the event ends
- Offline screenshot and selfie integrity checks

The following require an internet connection:

- Registration
- Email verification
- Password reset
- Profile edits
- Feedback submission

## 8. Bingo and Badges

### Bingo card management

Admins and organization members can manage Bingo cards within their permitted scope.

A Bingo card contains:

- Title
- Season label
- Active or draft state
- Streak threshold
- Up to nine cells
- Optional event association per cell
- Optional line and streak badges

Only one active card is allowed per organization. Organization members can manage cards for their organization, while admins can manage all cards.

### Student Bingo experience

1. The student opens the Bingo page.
2. The system loads active cards permitted by the student's role, creator, and mapped organization.
3. The student sees the card cells and associated event titles.
4. Successful attendance can complete a Bingo cell.
5. Completed cells are stored in `student_bingo_cells`.
6. Completed lines and streaks can award organization badges and points.
7. Awards are stored in `student_org_badges` and shown in the student experience.

### Bingo visibility

- Admin-created active cards are global.
- Organization-created active cards require a matching student program mapping.
- Bingo cells inherit the visibility of their parent card.

## 9. Dashboards and Features

### Admin dashboard

The admin dashboard includes:

- Organization management
- Faculty and organization account creation
- Student account listing and approval
- Student account actions
- Organization-program alignment
- Event approval and oversight
- Event management
- Bingo overview
- Student achievements
- Reports and attendance review
- Analytics
- Broadcast notifications
- System settings
- Audit-related administration tools

### Faculty dashboard

The faculty dashboard includes:

- Published event count
- Read-only event access
- Attendance reports
- Absentee reports
- Live attendance monitoring
- Analytics
- Attendance review and monitoring tools

Faculty accounts are reports-focused and do not create events.

### Organization dashboard

The organization dashboard includes:

- Organization event creation
- Event calendar management
- QR code display
- OTP generation and rotation
- Live attendance monitoring
- Attendance reports
- Organization Bingo cards
- Organization badges
- Student progress and awards

### Student experience

The student experience includes:

- Student registration
- Student login
- Email verification
- Password recovery
- Home statistics
- Published event discovery
- Event details
- QR attendance check-in
- GPS verification
- OTP verification
- Selfie verification
- Checkout
- Attendance history
- Notifications
- Bingo cards and progress
- Rewards and achievements
- Profile viewing and editing
- Terms and privacy information

## 10. Reports, Monitoring, and Analytics

### Live attendance monitor

The live monitor subscribes to attendance record changes and updates when students check in. Active attendance includes both:

- `checked_in`
- `late`

The monitor can show student identity, program, check-in time, distance, selfie status, and related event information.

### Reports

Reports can include:

- Attendance records
- Check-in and checkout times
- GPS distance from venue
- Selfie links for authorized staff
- Student program and year level
- Absentees
- Event-level attendance summaries

### Analytics

Analytics pages aggregate attendance and participation data for staff users. The data is protected by role and event visibility rules.

## 11. Realtime Updates

The web dashboard includes a shared Supabase Realtime listener. It refreshes server-rendered dashboard data when relevant database changes occur.

Subscribed data sources include:

- Users
- Students
- Staff profiles
- Organizations
- Organization-program mappings
- Events
- Attendance records
- Bingo cards
- Bingo cells
- Organization badges
- Student Bingo cells
- Student organization badges
- Student achievements
- Notifications
- System settings

This allows admin, faculty, and organization views to receive current data without requiring a manual browser refresh. Existing specialized subscriptions also support live attendance monitoring and notifications.

## 12. Security Model

### Authentication

All protected pages and functions require a valid Supabase Auth session. Server-side pages use secure cookies, while browser operations use the authenticated Supabase client.

### Role-based access

The `users.role` value controls access to admin, faculty, organization, and student features. The application checks roles in both frontend routing and backend policies.

### Row Level Security

RLS protects database records by role and ownership. Important boundaries include:

- Students can read their own profile and attendance data.
- Students can create or submit attendance only for themselves through the permitted workflow.
- Organization members can manage records for their organization.
- Admins can manage system-wide records.
- Faculty can access reports and permitted published data.
- Organization mappings control student access to organization events, Bingo cards, and badges.

### Storage security

The `student-ids` and `selfies` buckets are private. Student uploads are restricted to the authenticated student's own folder. Authorized staff can read attendance selfies for operational reports.

### Trusted server operations

Sensitive workflows are performed in Edge Functions or server-side API routes, including:

- OCR processing
- Student registration completion
- Student email resolution
- Password reset
- Event OTP generation
- QR rotation
- Check-in validation
- Checkout validation

Service-role credentials must remain server-side and must never be exposed to browser or mobile clients.

## 13. Important Database Areas

The database includes tables and functions for:

- Users and roles
- Students and staff profiles
- Organizations
- Events and QR tokens
- Attendance records
- Attendance locations and selfies
- Notifications
- Achievements and reward points
- Organization-program mappings
- Bingo cards and cells
- Organization badges
- Student Bingo progress
- Feedback
- Audit records
- System settings

Important helper functions include:

- `current_user_role()`
- `staff_organization_id()`
- `student_program_organization_ids()`
- `is_admin_user()`
- Haversine distance calculation
- Student point incrementing
- Achievement awarding
- Bingo completion processing

## 14. Edge Functions

| Function | Purpose |
| --- | --- |
| `check-in` | Validates student attendance, GPS, OTP, selfie, timing, duplicates, points, achievements, and Bingo progress |
| `check-out` | Completes a student's event checkout |
| `scan-student-id` | Sends student ID images through Veryfi OCR |
| `complete-student-registration` | Creates the verified student profile using trusted server credentials |
| `student-resolve-email` | Resolves a student ID to its registered email |
| `student-verify-reset` | Validates student identity for password recovery |
| `student-reset-password` | Resets a student password after verification |
| `generate-event-otp` | Creates an event attendance OTP |
| `rotate-event-qr` | Rotates an event QR token |
| `event-check-in-meta` | Returns event metadata and OTP requirements for scanning |

## 15. Deployment and Configuration

### Web environment variables

The web application requires:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key is used only by protected server routes and must not be exposed to the browser.

### Mobile configuration

The mobile application requires:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

These values are provided through the Flutter environment configuration or `--dart-define`.

### Edge Function secrets

The hosted Supabase project requires Veryfi credentials:

```text
VERYFI_CLIENT_ID=
VERYFI_USERNAME=
VERYFI_API_KEY=
```

### Typical development commands

```bash
# Web
cd apps/web
npm install
npm run dev

# Web validation
npm run build

# Mobile
cd apps/mobile
flutter pub get
flutter run

# Supabase migrations
cd backend
supabase db push

# Edge Functions
supabase functions deploy check-in
supabase functions deploy check-out
supabase functions deploy scan-student-id
```

## 16. End-to-End Summary

```text
Admin creates organizations and staff accounts
                |
                v
Admin maps student programs to organizations
                |
                v
Admin or organization member creates an event or Bingo card
                |
                v
Student sees global admin content or mapped organization content
                |
                v
Student scans event QR code
                |
                v
GPS -> OTP when required -> live selfie
                |
                v
Check-in Edge Function validates the request
                |
                v
Attendance record, points, achievements, and Bingo progress update
                |
                v
Realtime subscriptions update staff dashboards and monitoring views
```

The core security principle is that content ownership and student visibility are enforced by the database and trusted backend workflows, while the web and mobile clients provide the user interface for those rules.
