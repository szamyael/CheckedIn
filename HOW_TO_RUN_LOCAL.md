# How to Run CheckedIn Locally

This guide covers the local setup for the web app, mobile app, and Supabase backend used by this project.

## Prerequisites

Install the following before starting:

- Node.js 20+
- npm
- Flutter 3.11+
- Supabase CLI
- A local emulator/device for Flutter
- A Supabase project or local Supabase instance

## 1) Start the local Supabase backend

From the repository root:

```bash
cd backend
supabase start
supabase db reset
```

This starts the local Supabase services and applies the database migrations.

If you need to deploy Edge Functions locally later, you can use:

```bash
supabase functions serve
```

## 2) Configure environment variables

### Web app

Create the web app environment file:

```bash
cd apps/web
copy .env.example .env.local
```

Then fill in values from the Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The example file is already set up for this pattern.

### Mobile app

Create the mobile app environment file:

```bash
cd apps/mobile
copy .env.example .env
```

Then set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Supabase secrets for Veryfi

The app uses Veryfi inside Supabase Edge Functions, so the secrets must be configured in Supabase:

```bash
cd backend
supabase secrets set VERYFI_CLIENT_ID=your_id
supabase secrets set VERYFI_USERNAME=your_username
supabase secrets set VERYFI_API_KEY=your_key
```

## 3) Install and run the web app

```bash
cd apps/web
npm install
npm run dev
```

Then open:

- http://localhost:3000

## 4) Install and run the mobile app

```bash
cd apps/mobile
flutter pub get
flutter run
```

If you are using an emulator or simulator, make sure it is already started before running Flutter.

## 5) Optional: deploy Supabase functions

If you want the backend functions to be live in the project:

```bash
cd backend
supabase functions deploy check-in scan-student-id student-reset-password
supabase functions deploy complete-student-registration --no-verify-jwt
supabase functions deploy student-resolve-email student-verify-reset
supabase functions deploy generate-event-otp rotate-event-qr event-check-in-meta
```

## Common local workflow

1. Start Supabase
2. Copy env files from the examples
3. Install dependencies for web and mobile
4. Run the web app
5. Run the mobile app
6. Test login, QR check-in, and event flows

## Troubleshooting

### Web app can't connect to Supabase

- Check that your `.env.local` values are correct
- Confirm Supabase is running locally
- Verify your project URL and anon key match the active Supabase project

### Mobile app can't connect

- Confirm the `.env` file exists in the mobile app
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are valid
- Ensure the device/emulator is running and Flutter can access it

### Edge functions fail

- Ensure the Veryfi secrets are set with `supabase secrets set ...`
- Re-run `supabase start` if your local environment was reset
- Check logs with:

```bash
supabase functions logs <function-name>
```

## Useful repo paths

- Web app: `apps/web`
- Mobile app: `apps/mobile`
- Supabase config: `backend/supabase`
- App env examples: `apps/web/.env.example` and `apps/mobile/.env.example`

If you want, I can also create a shorter “quick start” version or a Windows-specific version for this repo.
