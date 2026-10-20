import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const analyticsPage = readFileSync(
  fileURLToPath(new URL("../src/app/dashboard/analytics/page.tsx", import.meta.url)),
  "utf8",
);

test("attendance trend ends at the current calendar date", () => {
  assert.match(analyticsPage, /buildAttendanceTrendPeriods\(new Date\(\)\)/);
  assert.match(analyticsPage, /label: period\.label/);
  assert.match(analyticsPage, /\.lt\("checked_in_at", period\.end\.toISOString\(\)\)/);
});

test("weekly periods label and stop the latest period at today", async () => {
  const { buildAttendanceTrendPeriods } = await import("../src/lib/attendance-trend.mjs");
  const now = new Date(2026, 9, 20, 12);
  const periods = buildAttendanceTrendPeriods(now);

  assert.equal(periods.length, 12);
  assert.equal(periods.at(-1).label, "Oct 20");
  assert.deepEqual(periods.at(-1).start, new Date(2026, 9, 19));
  assert.equal(periods.at(-1).end, now);
  assert.equal(periods.at(-2).end.getTime(), periods.at(-1).start.getTime());
});
