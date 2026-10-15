import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

test("web selfie submission reuses the location verified before the selfie", () => {
  const selfie = read("../src/app/student/(app)/attendance/selfie/page.tsx");

  assert.doesNotMatch(selfie, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(selfie, /latitude:\s*flow\.latitude/);
  assert.match(selfie, /longitude:\s*flow\.longitude/);
  assert.match(selfie, /accuracy_m:\s*flow\.accuracyM/);
});

test("mobile selfie submission reuses the already verified location", () => {
  const selfie = read("../../mobile/lib/screens/attendance/selfie_screen.dart");
  const submitFlow = selfie.slice(selfie.indexOf("_submitOnlineOrFallback"));

  assert.doesNotMatch(submitFlow, /_attendance\.getCurrentPosition\(\)/);
  assert.match(submitFlow, /latitude:\s*widget\.latitude/);
  assert.match(submitFlow, /longitude:\s*widget\.longitude/);
  assert.match(submitFlow, /accuracyM:\s*widget\.accuracyM/);
});

test("mobile check-in analyzes a captured selfie only once", () => {
  const service = read("../../mobile/lib/services/attendance_service.dart");
  const submitCheckIn = service.slice(
    service.indexOf("Future<CheckInSubmission> submitCheckIn"),
    service.indexOf("Future<CheckInSubmission> captureOfflineAttendance"),
  );

  assert.equal(
    (submitCheckIn.match(/SelfieIntegrityAnalyzer\.analyze/g) ?? []).length,
    1,
  );
  assert.match(submitCheckIn, /_buildCaptureIntegrity\(analysis\)/);
  const captureIntegrity = service.slice(
    service.indexOf("Map<String, dynamic> _buildCaptureIntegrity"),
    service.indexOf("Future<CheckInSubmission> submitCheckIn"),
  );
  assert.doesNotMatch(
    captureIntegrity,
    /SelfieIntegrityAnalyzer\.analyze/,
  );
});

test("server check-in still verifies submitted coordinates against the venue", () => {
  const checkIn = read("../../../backend/supabase/functions/check-in/index.ts");

  assert.match(checkIn, /rpc\(\s*"haversine_distance_m"/);
  assert.match(checkIn, /distanceM\s*>\s*allowedRadius/);
});
