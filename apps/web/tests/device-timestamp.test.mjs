import assert from "node:assert/strict";
import test from "node:test";
import { formatDeviceCaptureTimestamp } from "../src/lib/device-capture-timestamp.ts";

test("formats captured time using the scanning device UTC offset", () => {
  assert.equal(
    formatDeviceCaptureTimestamp("2026-10-14T01:18:52.000Z", 480),
    "Oct 14, 2026, 9:18:52 AM (UTC+08:00)",
  );
});

test("handles negative offsets that cross into the previous date", () => {
  assert.equal(
    formatDeviceCaptureTimestamp("2026-10-14T01:18:52.000Z", -300),
    "Oct 13, 2026, 8:18:52 PM (UTC-05:00)",
  );
});

test("labels older captures that lack a recorded device offset", () => {
  assert.equal(
    formatDeviceCaptureTimestamp("2026-10-14T01:18:52.000Z", null),
    "Oct 14, 2026, 1:18:52 AM (UTC; device timezone unavailable)",
  );
});
