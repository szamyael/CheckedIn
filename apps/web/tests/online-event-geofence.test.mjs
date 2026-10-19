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
  assert.match(metadata, /event\.requires_location\s*===\s*false/);
  assert.match(checkIn, /requiresLocation\s*=\s*event\.requires_location\s*!==\s*false/);
  assert.match(checkIn, /latitude:\s*requiresLocation\s*\?\s*latitude\s*:\s*null/);
  assert.match(checkIn, /longitude:\s*requiresLocation\s*\?\s*longitude\s*:\s*null/);
});

test("web and mobile let online-event check-ins continue without requesting GPS", () => {
  const webScan = read("../src/app/student/(app)/attendance/scan/page.tsx");
  const mobileResolve = read("../../mobile/lib/screens/attendance/attendance_resolve_screen.dart");

  assert.match(webScan, /requires_location\s*===\s*false/);
  assert.match(mobileResolve, /requires_location'\]\s*==\s*false/);
});
