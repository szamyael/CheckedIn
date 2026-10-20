import assert from "node:assert/strict";
import test from "node:test";
import {
  isLocationPermissionDenied,
  locationErrorMessage,
  isPermissionErrorMessage,
} from "../src/lib/student/browser-permissions.ts";

test("does not classify unavailable geolocation as a blocked permission", () => {
  assert.equal(
    isPermissionErrorMessage("Geolocation is not supported in this browser."),
    false,
  );
});

test("only a denied browser permission is classified as location-blocked", () => {
  assert.equal(isLocationPermissionDenied({ code: 1 }), true);
  assert.equal(isLocationPermissionDenied({ code: 2 }), false);
  assert.equal(isLocationPermissionDenied({ code: 3 }), false);
  assert.equal(isLocationPermissionDenied(new Error("Position unavailable")), false);
});

test("explains unavailable and timed-out location separately from permission denial", () => {
  assert.equal(
    locationErrorMessage({ code: 2 }),
    "Your device could not determine your location. Check that location services are on and try again.",
  );
  assert.equal(
    locationErrorMessage({ code: 3 }),
    "Location request timed out. Move to an area with a clear GPS signal and try again.",
  );
});
