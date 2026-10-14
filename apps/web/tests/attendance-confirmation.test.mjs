import assert from "node:assert/strict";
import test from "node:test";
import {
  getAttendanceAction,
  getAttendanceActionLabel,
} from "../src/lib/attendance-confirmation.ts";

test("recognizes a newly inserted check-in", () => {
  assert.equal(
    getAttendanceAction("INSERT", null, {
      checked_in_at: "2026-10-14T10:00:00Z",
    }),
    "check_in",
  );
});

test("recognizes each newly recorded attendance action", () => {
  const actions = [
    ["break_out_at", "break_out"],
    ["break_in_at", "break_in"],
    ["checked_out_at", "check_out"],
  ];

  for (const [field, action] of actions) {
    assert.equal(
      getAttendanceAction(
        "UPDATE",
        { checked_in_at: "2026-10-14T10:00:00Z", [field]: null },
        { checked_in_at: "2026-10-14T10:00:00Z", [field]: "2026-10-14T10:05:00Z" },
      ),
      action,
    );
  }
});

test("ignores unrelated updates and already-recorded attendance actions", () => {
  const row = {
    checked_in_at: "2026-10-14T10:00:00Z",
    break_out_at: "2026-10-14T10:05:00Z",
    break_in_at: null,
    checked_out_at: null,
  };

  assert.equal(getAttendanceAction("UPDATE", row, { ...row, status: "on_break" }), null);
  assert.equal(
    getAttendanceAction("UPDATE", row, { ...row, break_out_at: row.break_out_at }),
    null,
  );
});

test("labels each attendance confirmation for the notification", () => {
  assert.deepEqual(
    ["check_in", "check_out", "break_in", "break_out"].map(getAttendanceActionLabel),
    ["Check in confirmed", "Check out confirmed", "Break in confirmed", "Break out confirmed"],
  );
});
