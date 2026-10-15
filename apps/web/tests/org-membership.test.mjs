import assert from "node:assert/strict";
import test from "node:test";
import {
  canActivateMembership,
  canManageMembership,
  filterMembershipReport,
} from "../src/lib/org-membership.ts";
import { hasUsableCoordinates } from "../src/lib/student/location-verification.ts";

const mappedPaidStudent = {
  program: "BSIT",
  section: "A",
  year_level: 2,
  paid_at: "2026-10-01T00:00:00Z",
};

test("only mapped students can be managed by an organization", () => {
  assert.equal(canManageMembership("BSIT", ["bsit"]), true);
  assert.equal(canManageMembership("BSCS", ["BSIT"]), false);
});

test("only paid mapped students can be activated", () => {
  assert.equal(canActivateMembership(mappedPaidStudent, ["BSIT"]), true);
  assert.equal(
    canActivateMembership({ ...mappedPaidStudent, paid_at: null }, ["BSIT"]),
    false,
  );
  assert.equal(canActivateMembership(mappedPaidStudent, ["BSCS"]), false);
});

test("filters membership reports by section and year level", () => {
  const report = filterMembershipReport(
    [
      mappedPaidStudent,
      { ...mappedPaidStudent, section: "B", year_level: 3, paid_at: null },
    ],
    { section: "A", yearLevel: "2" },
  );
  assert.deepEqual(report, [mappedPaidStudent]);
});

test("accepts a location with low reported accuracy for server-side geofence validation", () => {
  assert.equal(hasUsableCoordinates(14.5995, 120.9842), true);
});
