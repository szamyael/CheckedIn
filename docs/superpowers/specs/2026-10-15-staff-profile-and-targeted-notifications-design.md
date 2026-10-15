# Staff Profiles and Targeted Notifications

## Intent

Let Admin, Faculty, and Organization staff keep their CheckedIn profile details
current, and let Admins send an announcement to one student without changing the
existing broadcast audiences.

## Goals

- Provide a shared staff profile page for avatar, first name, optional middle
  name, last name, email, and password.
- Require an email OTP reauthentication before changing email or password.
- Keep the current email usable until the replacement email is confirmed, and
  keep `public.users.email` synchronized with Supabase Auth.
- Improve the Admin broadcast form and support one active student as a recipient.
- Show a selected student's avatar, name, student ID, section, and program.
- Preserve existing broadcast behavior and admin-only notification insertion.

## Non-goals

- No student self-service profile changes.
- No changes to mobile screens, notification delivery channels, or notification
  read behavior.
- No targeted notifications for non-admin roles.
- No change to the existing “all active students” or “all staff” audiences.
- No public access to staff profile images.

## Design

### Shared staff profile

Add a `/dashboard/profile` page linked from the shared dashboard navigation,
available to Admin, Faculty, and Organization staff. Reuse the existing
dashboard form and card styling. Show the current avatar with an upload/preview
control, followed by editable first, optional middle, and last name fields.
Separate email and password changes from ordinary profile saves so each can
show its own OTP and result/error state.

All staff accounts created by the current application, including Faculty,
store names in `public.staff_profiles`. Use that shared source rather than
`public.faculty`, which the current staff-creation flow does not populate. Add
`middle_name` and `profile_photo_url` to `staff_profiles`, since those fields
are absent there. Permit authenticated users to update only their own permitted
profile fields. Use a private `profile-avatars` bucket with per-user path
restrictions; do not repurpose the private student ID bucket.

Use Supabase Auth reauthentication to send a nonce to the current email and
require that code before calling `updateUser` for email or password. Email
replacement remains pending until Supabase confirms it. Synchronize the
application's `users.email` mirror only after Auth reports the confirmed
address. Show explicit errors and never report a change as successful before
the corresponding update succeeds.

### Admin broadcast

Keep the broadcast form in Admin settings and reorganize it into recipient,
message, and send sections. Retain “All active students” and “All staff.”
Add “One student,” with a search over active students by name, student ID,
section, or program. Return a bounded result list; each selectable card shows
the student's avatar, name, student ID, section, and program. Use the existing
student avatar field and signed URLs.

Require one selected recipient in this mode and recheck that student's active
status immediately before sending. Keep notification creation behind the
existing Admin-only database policy. Preserve audit logging and show clear
loading, empty, success, and error states.

## Constraints and builder calls

- Build on the existing Next.js, Supabase, dashboard components, and installed
  dependencies; add no new package for these flows.
- Keep profile data role-specific rather than copying names into `users`.
- Use the current email as the OTP destination. A changed email is not treated
  as active until the Auth confirmation flow completes.
- Student recipients must be active at selection and send time.
- Keep the work scoped to the web Admin, Faculty, and Organization dashboards.

## Acceptance

- Each supported staff role can load and save its own names and avatar, but
  cannot edit another user's profile.
- Invalid images, failed uploads, wrong/expired OTPs, duplicate or invalid
  email changes, and failed password updates produce visible errors.
- Email/password changes require successful OTP reauthentication; an
  unconfirmed replacement email does not replace the existing address.
- Admin broadcasts still reach the same existing audiences.
- Direct notices can be sent only to one selected, active student and include
  the selected student ID in audit details.
- Recipient search cards show all requested identity and academic fields.
- Focused web tests, TypeScript, lint, and production build pass; migration and
  RLS behavior are verified.
