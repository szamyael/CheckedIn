import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const analyticsPage = readFileSync(
  fileURLToPath(new URL("../src/app/dashboard/analytics/page.tsx", import.meta.url)),
  "utf8",
);
const migrationPath = fileURLToPath(
  new URL(
    "../../../backend/supabase/migrations/087_manual_attendance_rewards.sql",
    import.meta.url,
  ),
);

test("analytics counts every confirmed attendance status and excludes excused records", () => {
  assert.match(
    analyticsPage,
    /const ATTENDANCE_STATUSES = \["checked_in", "late", "on_break", "checked_out"\]/,
  );
  assert.equal(
    (analyticsPage.match(/\.in\("attendance_records\.status", ATTENDANCE_STATUSES\)/g) ?? [])
      .length,
    3,
  );
  assert.equal(
    (analyticsPage.match(/\.in\("status", ATTENDANCE_STATUSES\)/g) ?? []).length,
    2,
  );
});

test("manual attendance insertions and check-ins award event, milestone, and bingo recognition", () => {
  assert.ok(existsSync(migrationPath), "manual attendance rewards migration is installed");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /AFTER INSERT OR UPDATE OF status, is_manual_override/);
  assert.match(migration, /NEW\.is_manual_override IS DISTINCT FROM true/);
  assert.match(migration, /NEW\.status NOT IN \('checked_in', 'late'\)/);
  assert.match(migration, /award_check_in_achievements/);
  assert.match(migration, /apply_bingo_after_check_in/);
  assert.match(migration, /status IN \('checked_in', 'late', 'on_break', 'checked_out'\)/);
  assert.match(migration, /increment_student_points/);
  assert.match(migration, /NEW\.is_offline IS DISTINCT FROM true/);
  assert.match(migration, /OLD\.status NOT IN \('checked_in', 'late', 'on_break', 'checked_out'\)/);
});

test("scanner prevents duplicate in-flight scans without blocking another student", async () => {
  const { claimCampusPassScanToken } = await import("../src/lib/campus-pass.mjs");
  const pending = new Set();

  assert.equal(claimCampusPassScanToken("student-a", pending), true);
  assert.equal(claimCampusPassScanToken("student-a", pending), false);
  assert.equal(claimCampusPassScanToken("student-b", pending), true);
});
