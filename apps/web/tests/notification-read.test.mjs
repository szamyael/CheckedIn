import assert from "node:assert/strict";
import test from "node:test";
import {
  getUpdatedNotificationIds,
  requireNotificationUpdated,
} from "../src/lib/notification-read.ts";

test("returns only IDs of notifications confirmed updated", () => {
  assert.deepEqual(
    getUpdatedNotificationIds({ data: [{ id: "n1" }, { id: "n2" }], error: null }),
    ["n1", "n2"],
  );
});

test("surfaces Supabase update errors", () => {
  assert.throws(
    () => getUpdatedNotificationIds({ data: null, error: { message: "permission denied" } }),
    /permission denied/,
  );
});

test("returns an empty list when no notification rows changed", () => {
  assert.deepEqual(getUpdatedNotificationIds({ data: [], error: null }), []);
});

test("rejects a single-notification update with no matching row", () => {
  assert.throws(
    () => requireNotificationUpdated({ data: [], error: null }, "n1"),
    /No notification was updated/,
  );
});
