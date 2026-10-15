import assert from "node:assert/strict";
import test from "node:test";
import { getLocationVerificationError } from "../src/lib/student/location-verification.ts";

test("does not reject a valid in-range coordinate because reported accuracy is high", () => {
  assert.equal(getLocationVerificationError(14.5995, 120.9842), null);
});

test("rejects invalid coordinates before geofence verification", () => {
  assert.equal(
    getLocationVerificationError(95, 120.9842),
    "Invalid GPS coordinates. Please try again.",
  );
});
