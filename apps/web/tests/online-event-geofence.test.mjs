import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("events can opt out of GPS while existing events keep geofencing enabled", () => {
  const migration = read("../../../backend/supabase/migrations/085_optional_event_geofence.sql");

  assert.match(migration, /ADD COLUMN requires_location BOOLEAN NOT NULL DEFAULT TRUE/i);
  assert.match(migration, /ALTER COLUMN latitude DROP NOT NULL/i);
  assert.match(migration, /ALTER COLUMN longitude DROP NOT NULL/i);
  assert.match(migration, /attendance_records[\s\S]*ALTER COLUMN latitude DROP NOT NULL/i);
  assert.match(migration, /attendance_records[\s\S]*ALTER COLUMN longitude DROP NOT NULL/i);
});

test("event forms persist the online-event geofence setting", () => {
  const createForm = read("../src/components/CreateEventForm.tsx");
  const editForm = read("../src/components/EditEventForm.tsx");

  assert.match(createForm, /requires_location:\s*requiresLocation/);
  assert.match(editForm, /requires_location:\s*requiresLocation/);
  assert.match(createForm, /Online event/);
  assert.match(editForm, /Online event/);
});

test("attendance metadata and final check-in enforce GPS only when the event requires it", () => {
  const metadata = read("../../../backend/supabase/functions/event-check-in-meta/index.ts");
  const checkIn = read("../../../backend/supabase/functions/check-in/index.ts");

  assert.match(metadata, /requires_location/);
  assert.match(
    metadata,
    /event\.requires_location\s*!==\s*false\s*&&\s*event\.venue_name\?\.trim\(\)\.toLowerCase\(\)\s*!==\s*"online event"/,
  );
  assert.match(checkIn, /requiresLocation\s*=\s*event\.requires_location\s*!==\s*false/);
  assert.match(checkIn, /latitude:\s*requiresLocation\s*\?\s*latitude\s*:\s*null/);
  assert.match(checkIn, /longitude:\s*requiresLocation\s*\?\s*longitude\s*:\s*null/);
});

test("legacy online events do not require GPS even when their flag defaults to true", () => {
  const metadata = read("../../../backend/supabase/functions/event-check-in-meta/index.ts");
  const checkIn = read("../../../backend/supabase/functions/check-in/index.ts");

  assert.match(
    metadata,
    /event\.requires_location\s*!==\s*false\s*&&\s*event\.venue_name\?\.trim\(\)\.toLowerCase\(\)\s*!==\s*"online event"/,
  );
  assert.match(
    checkIn,
    /event\.requires_location\s*!==\s*false\s*&&\s*event\.venue_name\?\.trim\(\)\.toLowerCase\(\)\s*!==\s*"online event"/,
  );
});

test("web and mobile let online-event check-ins continue without requesting GPS", () => {
  const webScan = read("../src/app/student/(app)/attendance/scan/page.tsx");
  const mobileResolve = read("../../mobile/lib/screens/attendance/attendance_resolve_screen.dart");
  const webLocation = read("../src/app/student/(app)/attendance/location/page.tsx");
  const mobileLocation = read("../../mobile/lib/screens/attendance/location_check_screen.dart");

  assert.match(webScan, /meta\.requires_location\s*\?\?/);
  assert.match(
    mobileResolve,
    /AttendanceService\.requiresLocationForCheckIn\(\s*meta,?\s*\)/,
  );
  assert.match(webScan, /meta\.venue_name[\s\S]*online event/i);
  assert.match(
    mobileLocation,
    /AttendanceService\.requiresLocationForCheckIn\(\s*eventMeta,?\s*\)/,
  );
  assert.match(webLocation, /flow\.requiresLocation\s*===\s*false/);
  assert.match(
    mobileLocation,
    /AttendanceService\.requiresLocationForCheckIn\(\s*eventMeta,?\s*\)/,
  );
});

test("web and mobile send the same geofence request and allow GPS time to resolve", () => {
  const webLocation = read("../src/app/student/(app)/attendance/location/page.tsx");
  const mobileLocation = read("../../mobile/lib/screens/attendance/location_check_screen.dart");
  const mobileService = read("../../mobile/lib/services/attendance_service.dart");
  const metadata = read("../../../backend/supabase/functions/event-check-in-meta/index.ts");

  assert.match(webLocation, /functions\.invoke\(\s*"event-check-in-meta"/);
  assert.match(mobileService, /functions\.invoke\(\s*'event-check-in-meta'/);
  assert.match(
    webLocation,
    /body:\s*\{\s*qr_token:\s*flow\.qrToken,\s*latitude:\s*pos\.coords\.latitude,\s*longitude:\s*pos\.coords\.longitude,\s*accuracy_m:\s*pos\.coords\.accuracy,/,
  );
  assert.match(
    mobileService,
    /body:\s*\{\s*'qr_token':\s*qrToken,\s*'latitude':\s*latitude,\s*'longitude':\s*longitude,\s*'accuracy_m':\s*accuracyM,/,
  );
  assert.match(metadata, /const latitude = body\.latitude/);
  assert.match(metadata, /const longitude = body\.longitude/);
  assert.match(metadata, /location_ok:\s*true/);

  assert.match(webLocation, /timeout:\s*60000/);
  assert.match(mobileService, /timeLimit:\s*Duration\(seconds:\s*60\)/);
});
