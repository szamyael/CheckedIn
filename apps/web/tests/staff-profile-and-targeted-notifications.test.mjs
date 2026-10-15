import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("staff profile migration limits shared staff profile writes and avatar storage to the signed-in user", () => {
  const migration = read("../../../backend/supabase/migrations/079_staff_profiles_and_avatar_storage.sql");

  assert.match(migration, /ADD COLUMN IF NOT EXISTS middle_name/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS profile_photo_url/);
  assert.match(migration, /staff_profiles_update_own[\s\S]*?id = auth\.uid\(\)[\s\S]*?WITH CHECK \(id = auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /public\.faculty/);
  assert.match(migration, /REVOKE UPDATE ON public\.staff_profiles FROM authenticated/);
  assert.match(migration, /GRANT UPDATE \(first_name, middle_name, last_name, profile_photo_url\)/);
  assert.match(migration, /bucket_id = 'profile-avatars'[\s\S]*?auth\.uid\(\)::text = \(storage\.foldername\(name\)\)\[1\]/);
  assert.match(migration, /CREATE TRIGGER[^;]*auth\.users/i);
});

test("all staff roles use the shared staff profile table and require current-email OTP", () => {
  const page = read("../src/app/dashboard/profile/page.tsx");
  const form = read("../src/components/StaffProfileForm.tsx");
  const layout = read("../src/app/dashboard/layout.tsx");

  assert.match(page, /admin.*faculty.*org_member/);
  assert.match(layout, /\/dashboard\/profile/);
  assert.match(page, /from\("staff_profiles"\)/);
  assert.doesNotMatch(page, /from\("faculty"\)/);
  assert.match(form, /middle_name/);
  assert.match(form, /profile_photo_url/);
  assert.match(form, /auth\.signInWithOtp/);
  assert.match(form, /auth\.verifyOtp/);
  assert.match(form, /type:\s*"email"/);
  assert.match(form, /data\.user\?\.id !== userId/);
  assert.match(form, /auth\.updateUser/);
});

test("admin broadcast supports active individual students with identity details", () => {
  const form = read("../src/components/BroadcastNotificationForm.tsx");

  assert.match(form, /one_student/);
  assert.match(form, /profile_photo_url/);
  assert.match(form, /student_id/);
  assert.match(form, /section/);
  assert.match(form, /program/);
  assert.match(form, /status.*active/);
  assert.match(form, /p_action:\s*"broadcast_notification"/);
  assert.match(form, /recipient_student_id/);
});

test("broadcast notifications store and show the sender identity and avatar", () => {
  const migrationPath = fileURLToPath(new URL("../../../backend/supabase/migrations/080_broadcast_senders_and_org_broadcasts.sql", import.meta.url));
  assert.ok(existsSync(migrationPath), "broadcast sender migration should exist");
  const migration = readFileSync(migrationPath, "utf8");
  const form = read("../src/components/BroadcastNotificationForm.tsx");
  const bell = read("../src/components/NotificationBell.tsx");
  const studentNotifications = read("../src/app/student/(app)/notifications/page.tsx");
  const sender = read("../src/components/NotificationSender.tsx");
  const mobileService = read("../../mobile/lib/services/notification_service.dart");
  const mobileScreen = read("../../mobile/lib/screens/notifications/notifications_screen.dart");

  assert.match(migration, /sender_id UUID/);
  assert.match(migration, /sender_name TEXT/);
  assert.match(migration, /sender_avatar_path TEXT/);
  assert.match(migration, /staff_profile_avatars_authenticated_read[\s\S]*?FOR SELECT TO authenticated[\s\S]*?bucket_id = 'profile-avatars'/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.send_organization_broadcast/);
  assert.match(migration, /program_name_key\(s\.program\)\s*=\s*public\.program_name_key\(op\.program\)/);
  assert.match(migration, /u\.status = 'active'/);
  assert.match(form, /sender_avatar_path/);
  assert.match(form, /sender_name/);
  assert.match(form, /send_organization_broadcast/);
  assert.match(bell, /NotificationSender/);
  assert.match(studentNotifications, /NotificationSender/);
  assert.match(sender, /profile-avatars/);
  assert.match(mobileService, /sender_avatar_path/);
  assert.match(mobileScreen, /senderAvatarUrl/);
});

test("organization workspace exposes only organization-scoped broadcast delivery", () => {
  const page = read("../src/app/dashboard/org/page.tsx");
  const migrationPath = fileURLToPath(new URL("../../../backend/supabase/migrations/080_broadcast_senders_and_org_broadcasts.sql", import.meta.url));
  assert.ok(existsSync(migrationPath), "organization broadcast migration should exist");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(page, /BroadcastNotificationForm audience="organization"/);
  assert.match(page, /profile\?\.role === "org_member"/);
  assert.match(migration, /v_role IS DISTINCT FROM 'org_member'::public\.user_role/);
  assert.match(migration, /v_organization_id IS NULL/);
  assert.match(migration, /op\.organization_id = v_organization_id/);
});
