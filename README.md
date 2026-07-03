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
3. Student confirms/edits name & program (ID number is locked)
4. System validates OCR fields match user input
5. Student sets password → account created (**pending admin approval**)
6. Admin approves student in web portal
7. Login: **Student ID + Password**

## Attendance Flow (Mobile)

1. Scan event QR code
2. Enable GPS → verify within event geofence
3. Capture live selfie (camera, not gallery upload)
4. Server records timestamp + location + selfie

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

## Production deploy

### Database migrations

```bash
cd backend
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Edge Functions

```bash
cd backend
supabase functions deploy check-in
supabase functions deploy scan-student-id
supabase functions deploy student-reset-password
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
