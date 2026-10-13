import assert from "node:assert/strict";
import { test } from "node:test";

const { isOfflineCheckInAttempt } = await import("./offline-policy.ts").catch(
  () => ({}),
);

test("offline captures cannot be sent through the immediate check-in path", () => {
  assert.equal(
    typeof isOfflineCheckInAttempt,
    "function",
    "offline-policy.ts must export isOfflineCheckInAttempt",
  );
  assert.equal(
    isOfflineCheckInAttempt({ client_checked_in_at: "2026-01-01T00:00:00Z" }),
    true,
  );
  assert.equal(isOfflineCheckInAttempt({ client_checked_in_at: "" }), true);
  assert.equal(isOfflineCheckInAttempt({}), false);
});
