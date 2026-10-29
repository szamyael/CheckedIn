import assert from "node:assert/strict";
import { test } from "node:test";

const { requiresEventLocation } = await import("./event-location-policy.ts");

test("online venue labels do not require GPS even when location is enabled", () => {
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: " Online Event - Google Meet ",
    }),
    false,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "Virtual (Zoom)",
    }),
    false,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "Google Meet",
    }),
    false,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "Microsoft Teams Meeting",
    }),
    false,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "Teams",
    }),
    false,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "https://zoom.us/j/123456789",
    }),
    false,
  );
});

test("physical venues still follow the event location setting", () => {
  assert.equal(
    requiresEventLocation({
      requires_location: true,
      venue_name: "Main Hall",
    }),
    true,
  );
  assert.equal(
    requiresEventLocation({
      requires_location: false,
      venue_name: "Main Hall",
    }),
    false,
  );
});
