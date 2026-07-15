# CheckedIn — QR Event Attendance System

Monorepo for web (Admin / Faculty / Organization) and mobile (Students) attendance with geolocation, selfie verification, and Veryfi student ID OCR.

## Architecture

```
CHECKEDIN/
├── apps/
│   ├── web/          Next.js — Admin, Faculty, Org Members
│   └── mobile/       Flutter — Students only
└── backend/
    └── supabase/     PostgreSQL, Auth, Storage, Edge Functions
```

## Roles

| Role | Platform | Capabilities |
|------|----------|--------------|
| **Admin** | Web | Create faculty/org accounts, oversee system, all reports |
| **Faculty** | Web | Calendar events, QR codes, attendance reports |
| **Org Member** | Web | Post organization events on calendar |
| **Student** | Mobile | Register via ID scan, QR check-in with location + selfie |

## Student Registration Flow

1. Capture student ID photo (camera only)
2. **Veryfi** OCR extracts: Student ID (`0XXX-XXXX`), program, name
3. Student confirms/edits name, program, section (ID locked); provides real email
4. System validates OCR fields match user input
5. Student sets password → account created (**pending admin approval**)
6. Email verification code (Supabase OTP)
7. Admin approves student in web portal
8. Login: **Student ID + Password** (forgot password: scan ID → email OTP)

## Attendance Flow (Mobile)

1. Scan event QR or open event from list
2. Enable GPS → verify within event geofence
3. Enter attendance OTP if required (staff QR screen)
4. Capture live selfie (camera only)
5. Optional post-check-in feedback; server awards reward points

## Offline support (Mobile)

After **one successful online login** on a device:

- Sign in with Student ID + password **without internet** (local salted password unlock)
- Browse cached Home stats, Events, Profile, attendance history, and Notifications
- Start check-in (GPS + selfie); records queue locally and sync when back online with a live session
- Screenshot guard and selfie integrity checks still run offline

Registration, email verification, password reset, profile edits, and feedback require internet.


## Web Features (FR-aligned)

- **Admin:** dashboard, users/students/orgs, event approval, system settings, audit trail, broadcast notifications, analytics, absentee reports
- **Faculty / Org:** calendar events, QR codes, OTP generation, QR rotation, live monitor, reports
- **Org events:** publish submits for admin approval (`pending_approval` → `published`)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Flutter](https://flutter.dev/) 3.11+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Veryfi](https://www.veryfi.com/) API credentials

## Setup

### 1. Supabase

```bash
cd backend
supabase start
supabase db reset   # applies migrations
```

Set Edge Function secrets:

```bash
supabase secrets set VERYFI_CLIENT_ID=your_id
supabase secrets set VERYFI_USERNAME=your_username
supabase secrets set VERYFI_API_KEY=your_key
```

### 2. Web App

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Mobile App

```bash
cd apps/mobile
cp .env.example .env
flutter pub get
flutter run
```

## Environment Variables

### Web (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Copy all three from `backend/supabase/.env.example`.

### Mobile (`apps/mobile/.env` via `--dart-define` or envied)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

### Edge Functions (Supabase secrets)

```
VERYFI_CLIENT_ID=
VERYFI_USERNAME=
VERYFI_API_KEY=
```

## Database Migrations

| File | Purpose |
|------|---------|
| `001_extensions.sql` | uuid-ossp, citext |
| `002_enums.sql` | Roles, statuses |
| `003_auth_tables.sql` | Core users table |
| `004_students.sql` | Student profiles + ID format |
| `005_staff.sql` | Faculty, org profiles |
| `006_events.sql` | Calendar events + QR tokens |
| `007_attendance.sql` | Check-in records |
| `008_rls_policies.sql` | Row-level security |
| `009_functions.sql` | Haversine, ID validation |
| `010_triggers.sql` | updated_at triggers |
| `011_storage.sql` | student-ids and selfies buckets |
| `012_fix_student_rls.sql` | Student users insert/update policies |
| `013_phase_a_schema.sql` | Year level, attendance window, QR expiry fields |
| `014_achievements.sql` | Badges, milestones, award function |
| `015_realtime.sql` | Realtime publication for live monitor |
| `016_org_scoping.sql` | Org-scoped events/attendance RLS |
| `017_notifications.sql` | In-app notifications + realtime |
| `018_student_email_auth.sql` | Real email registration, student-resolve-email |
| `019_staff_event_visibility.sql` | Faculty/org can read published events |
| `020_fr_completion.sql` | OTP/QR security, audit logs, feedback, system settings, event approval, reward points, section |
| `021_manual_attendance.sql` | Staff manual attendance RPC, correction review, session settings for students |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `check-in` | Student attendance with GPS, selfie, optional OTP, late status, points, screenshot detection |
| `scan-student-id` | Veryfi OCR for registration |
| `complete-student-registration` | Service-role profile creation after signup (`--no-verify-jwt`) |
| `student-resolve-email` | Resolve student ID → email for login |
| `student-verify-reset` | ID scan for forgot-password flow |
| `student-reset-password` | Reset password after OTP |
| `generate-event-otp` | Staff generates attendance OTP |
| `rotate-event-qr` | Rotate event QR token |
| `event-check-in-meta` | Mobile: event title + OTP requirement for QR token |


### Database migrations

```bash
cd backend
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Edge Functions

```bash
cd backend
supabase functions deploy check-in scan-student-id student-reset-password
supabase functions deploy complete-student-registration --no-verify-jwt
supabase functions deploy student-resolve-email student-verify-reset
supabase functions deploy generate-event-otp rotate-event-qr event-check-in-meta
```

Ensure Veryfi secrets are set on the hosted project:

```bash
supabase secrets set VERYFI_CLIENT_ID=your_id
supabase secrets set VERYFI_USERNAME=your_username
supabase secrets set VERYFI_API_KEY=your_key
```

### Web (Vercel or similar)

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the host environment. Add your production URL to Supabase Auth redirect allow list for password reset (`/auth/callback`).

### Mobile

Build with production `SUPABASE_URL` and `SUPABASE_ANON_KEY` via `--dart-define` or your env loader.

## Student ID Format

`0XXX-XXXX` — 8 digits starting with `0`, hyphen after the 4th digit.

Example: `0123-4567`

## License

Private — academic project.
