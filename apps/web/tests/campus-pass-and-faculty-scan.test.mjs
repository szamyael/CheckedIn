import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("campus QR payload accepts only opaque UUID student-pass tokens", async () => {
  const modulePath = fileURLToPath(new URL("../src/lib/campus-pass.mjs", import.meta.url));
  assert.ok(existsSync(modulePath), "campus pass token parser should exist");
  const { normalizeCampusPassToken, getNewCampusPassTokens } = await import("../src/lib/campus-pass.mjs");

  assert.equal(normalizeCampusPassToken("A3F7C6A2-947D-4C69-801B-6808EDC51B5D"), "a3f7c6a2-947d-4c69-801b-6808edc51b5d");
  assert.equal(normalizeCampusPassToken("0123-4567"), null);
  assert.equal(normalizeCampusPassToken("student:a3f7c6a2-947d-4c69-801b-6808edc51b5d"), null);
  assert.equal(normalizeCampusPassToken(""), null);

  const seen = new Set();
  assert.deepEqual(
    getNewCampusPassTokens([
      "a3f7c6a2-947d-4c69-801b-6808edc51b5d",
      "b3f7c6a2-947d-4c69-801b-6808edc51b5d",
      "a3f7c6a2-947d-4c69-801b-6808edc51b5d",
    ], seen),
    [
      "a3f7c6a2-947d-4c69-801b-6808edc51b5d",
      "b3f7c6a2-947d-4c69-801b-6808edc51b5d",
    ],
  );
  assert.deepEqual(getNewCampusPassTokens([], seen), []);
  assert.deepEqual(
    getNewCampusPassTokens(["a3f7c6a2-947d-4c69-801b-6808edc51b5d"], seen),
    ["a3f7c6a2-947d-4c69-801b-6808edc51b5d"],
  );
});

test("campus pass scan result includes student identification and attendance action", async () => {
  const { parseCampusPassScanResult } = await import("../src/lib/campus-pass.mjs");

  assert.deepEqual(
    parseCampusPassScanResult({
      success: true,
      action: "checked_out",
      student: {
        name: "Ada Lovelace",
        student_id: "STU-1042",
        program: "Computer Science",
        year_level: 2,
        section: "A",
      },
    }),
    {
      success: true,
      action: "checked_out",
      student: {
        name: "Ada Lovelace",
        student_id: "STU-1042",
        program: "Computer Science",
        year_level: 2,
        section: "A",
      },
    },
  );
  assert.equal(
    parseCampusPassScanResult({
      success: true,
      action: "checked_in",
      student: { name: "Ada", student_id: "STU-1042", program: "CS", year_level: null, section: null },
    }).success,
    true,
  );
  assert.equal(
    parseCampusPassScanResult({
      success: true,
      action: "unknown",
      student: { name: "Ada", student_id: "STU-1042", program: "CS", year_level: null, section: null },
    }),
    null,
  );
});

test("campus passes have private per-student tokens and staff scan enforces event and student eligibility", () => {
  const migrationPath = fileURLToPath(new URL("../../../backend/supabase/migrations/082_student_campus_pass_and_staff_scan.sql", import.meta.url));
  assert.ok(existsSync(migrationPath), "campus pass migration should exist");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /CREATE TABLE public\.student_campus_passes/);
  assert.match(migration, /campus_pass_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid\(\)/);
  assert.match(migration, /student_campus_passes_select_own[\s\S]*?student_id = auth\.uid\(\)/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.student_campus_passes FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.get_my_campus_pass_token/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.staff_scan_student_campus_pass/);
  assert.match(migration, /v_role IS DISTINCT FROM 'admin' AND v_role IS DISTINCT FROM 'faculty'/);
  assert.match(migration, /v_student\.status IS DISTINCT FROM 'active'/);
  assert.match(migration, /attendance_starts_at > NOW\(\)/);
  assert.match(migration, /attendance_ends_at <= NOW\(\)/);
  assert.match(migration, /p_student_pass_token/);
  assert.match(migration, /ON CONFLICT \(event_id, student_id\) DO NOTHING/);
});

test("web and mobile campus passes flip to a QR student business card with event scan inside the front", () => {
  const webHome = read("../src/app/student/(app)/page.tsx");
  const mobileHome = read("../../mobile/lib/screens/home/home_screen.dart");
  const mobileManifest = read("../../mobile/pubspec.yaml");
  const mobileLockfile = read("../../mobile/pubspec.lock");

  assert.match(webHome, /QRCodeSVG/);
  assert.match(webHome, /campus_pass_token/);
  assert.match(webHome, /profile_photo_url/);
  assert.match(webHome, /section/);
  assert.match(webHome, /aria-pressed/);
  const webCardStart = webHome.indexOf("h-[300px] w-full [perspective:1000px]");
  const webCardEnd = webHome.indexOf("</section>", webCardStart);
  assert.ok(webCardStart >= 0 && webCardEnd > webCardStart);
  const webCard = webHome.slice(webCardStart, webCardEnd);
  assert.match(webCard, /aria-label="Show student identification"/);
  assert.match(webCard, /href="\/student\/attendance\/scan"/);
  assert.match(webCard, /aria-hidden=\{!passFlipped\}/);
  assert.match(webCard, /passFlipped && !reducedMotion/);
  assert.match(webCard, /reducedMotion && passFlipped/);
  assert.match(webCard, /motion-reduce:transition-none/);
  assert.match(webCard, /TAP CARD TO VIEW STUDENT ID/);
  const webFront = webCard.slice(webCard.indexOf('aria-label="Show student identification"'), webCard.indexOf('aria-label="Show campus pass front"'));
  const webBack = webCard.slice(webCard.indexOf('aria-label="Show campus pass front"'));
  assert.doesNotMatch(webFront, /summary\.avatarUrl/);
  assert.match(webBack, /summary\.avatarUrl/);
  assert.equal((webCard.match(/right-5 top-1\/2/g) ?? []).length, 2);
  assert.match(webCard, /qrExpanded/);
  assert.match(webCard, /aria-modal="true"/);
  assert.match(webCard, /duration-700/);
  assert.match(webCard, /summary\.studentId/);
  assert.match(webFront, /summary\.name[\s\S]*STUDENT ID[\s\S]*\{summary\.studentId\}/);
  assert.match(webFront, /text-xl font-bold tracking-\[0\.06em\] text-white sm:text-2xl/);
  assert.match(webCard, /STUDENT IDENTIFICATION[\s\S]*\{summary\.studentId\}/);
  assert.match(mobileHome, /QrImageView/);
  assert.match(mobileHome, /fetchCampusPassToken/);
  assert.match(mobileHome, /profile_photo_url/);
  assert.match(mobileHome, /section/);
  assert.match(mobileHome, /disableAnimations/);
  assert.match(mobileHome, /TAP CARD TO VIEW STUDENT ID/);
  assert.match(mobileHome, /Scan event QR/);
  assert.match(mobileHome, /onScan/);
  const mobileFrontStart = mobileHome.indexOf("Widget _passFront");
  const mobileBackStart = mobileHome.indexOf("Widget _studentCard");
  assert.ok(mobileFrontStart >= 0 && mobileBackStart > mobileFrontStart);
  const mobileFront = mobileHome.slice(mobileFrontStart, mobileBackStart);
  const mobileBack = mobileHome.slice(mobileBackStart, mobileHome.indexOf("\n}", mobileBackStart));
  assert.doesNotMatch(mobileFront, /_avatar\(/);
  assert.match(mobileFront, /widget\.onScan/);
  assert.match(mobileFront, /Positioned\.fill\(/);
  assert.match(mobileBack, /_avatar\(/);
  assert.match(mobileBack, /_showFullScreenQr/);
  assert.match(mobileHome, /showDialog/);
  assert.match(mobileHome, /Dialog\.fullscreen/);
  assert.match(mobileFront, /fontSize: 21/);
  assert.match(mobileFront, /widget\.studentId/);
  assert.match(mobileBack, /STUDENT IDENTIFICATION[\s\S]*widget\.studentId/);
  assert.match(mobileBack, /Border\.all/);
  assert.match(mobileBack, /outlineVariant/);
  assert.match(mobileManifest, /qr_flutter:/);
  assert.match(mobileLockfile, /  qr_flutter:\n    dependency: "direct main"/);
  assert.match(mobileLockfile, /  qr:\n    dependency: transitive/);
});

test("faculty scanner selects an active event and records a scanned campus pass", () => {
  const dashboard = read("../src/app/dashboard/faculty/page.tsx");
  const layout = read("../src/app/dashboard/layout.tsx");
  const scanPagePath = fileURLToPath(new URL("../src/app/dashboard/faculty/check-in/page.tsx", import.meta.url));
  const scannerPath = fileURLToPath(new URL("../src/components/CampusPassAttendanceScanner.tsx", import.meta.url));
  assert.ok(existsSync(scanPagePath), "faculty check-in page should exist");
  assert.ok(existsSync(scannerPath), "faculty campus pass scanner should exist");
  const scanPage = readFileSync(scanPagePath, "utf8");
  const scanner = readFileSync(scannerPath, "utf8");

  assert.match(dashboard, /\/dashboard\/faculty\/check-in/);
  assert.match(layout, /Student check-in/);
  assert.match(scanPage, /attendance_starts_at/);
  assert.match(scanPage, /status.*published/);
  assert.match(scanner, /normalizeCampusPassToken/);
  assert.match(scanner, /staff_scan_student_campus_pass/);
  assert.match(scanner, /p_event_id/);
  assert.match(scanner, /p_student_pass_token/);
  assert.match(scanner, /useState\(""\)/);
  assert.match(scanner, /<option value="">Select an event/);
  assert.match(scanner, /\{selectedEvent \?/);
});

test("faculty scanner does not start a camera from a cleaned-up effect", () => {
  const scanner = read("../src/components/CampusPassAttendanceScanner.tsx");
  const cameraEffect = scanner.slice(scanner.indexOf("function CampusPassCamera"), scanner.indexOf("export function CampusPassAttendanceScanner"));

  assert.match(cameraEffect, /queueMicrotask\(start\)/);
  assert.match(cameraEffect, /const start = \(\) => \{\s*if \(cancelled\) return;/);
});

test("staff campus-pass scans toggle attendance and report the resulting action", () => {
  const migrationPath = fileURLToPath(new URL("../../../backend/supabase/migrations/083_staff_campus_pass_check_out.sql", import.meta.url));
  assert.ok(existsSync(migrationPath), "campus pass check-out migration should exist");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /ON CONFLICT \(event_id, student_id\) DO UPDATE SET/);
  assert.match(migration, /checked_out_at = CASE/);
  assert.match(migration, /RETURNING id, status INTO v_attendance_id, v_action/);
  assert.match(migration, /'action', v_action/);
});

test("faculty scanner reads every visible QR and keeps scan results with student IDs", () => {
  const scanner = read("../src/components/CampusPassAttendanceScanner.tsx");

  assert.match(scanner, /BarcodeDetector/);
  assert.match(scanner, /activeDetector\.detect\(video\)/);
  assert.match(scanner, /getNewCampusPassTokens/);
  assert.match(scanner, /setScanResults/);
  assert.match(scanner, /Student ID/);
  assert.match(scanner, /result\.action === "checked_in"/);
  assert.doesNotMatch(scanner, /Scan another student/);
});
