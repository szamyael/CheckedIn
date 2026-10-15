import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  canActivateMembership,
  canManageMembership,
  filterMembershipReport,
  membershipActionChanges,
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
  assert.equal(
    canManageMembership("Bachelor of Science in Information Technology", ["BS Information Technology"]),
    true,
  );
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

test("recording walk-in payment activates the student account", () => {
  assert.deepEqual(membershipActionChanges("mark_paid", "2026-10-16T00:00:00.000Z"), {
    paidAt: "2026-10-16T00:00:00.000Z",
    userUpdate: { status: "active", disabled_at: null, account_status_reason: null },
  });
});

test("marking a filtered paid student unpaid updates their mapped payment record", () => {
  const routePath = new URL("../src/app/api/org/memberships/route.ts", import.meta.url);
  const panelPath = new URL("../src/components/OrganizationMembershipPanel.tsx", import.meta.url);
  const route = readFileSync(fileURLToPath(routePath), "utf8");
  const panel = readFileSync(fileURLToPath(panelPath), "utf8");

  assert.match(
    panel,
    /if \(selectedIds\.length > 1 \|\| \(action !== "mark_paid" && action !== "mark_unpaid"\)\) \{[\s\S]*?window\.confirm/,
  );
  assert.match(panel, /student\.paid_at \? "bg-green-100[^"]*" : "bg-red-100[^"]*"/);
  assert.doesNotMatch(route, /Update payment status one student at a time/);
  assert.match(route, /p_student_ids:\s*mappedStudentIds/);
  assert.match(panel, /Mark all as unpaid/);
  assert.match(panel, /update\("mark_unpaid",\s*paidIds\)/);
  assert.match(panel, /update\("mark_paid",\s*unpaidIds\)/);
  assert.match(panel, /filtered\.filter\(\(student\) => student\.paid_at\)/);
});

test("marking a membership unpaid disables the student account", () => {
  assert.deepEqual(membershipActionChanges("mark_unpaid", "2026-10-16T00:00:00.000Z"), {
    paidAt: null,
    userUpdate: {
      status: "disabled",
      disabled_at: "2026-10-16T00:00:00.000Z",
      account_status_reason: "Membership disabled by organization",
    },
  });
});

test("payment status is the only membership account action in the panel", () => {
  const panelPath = new URL("../src/components/OrganizationMembershipPanel.tsx", import.meta.url);
  const panel = readFileSync(fileURLToPath(panelPath), "utf8");

  assert.doesNotMatch(panel, /"Actions"|>Activate<\/button>|>Disable<\/button>|Disable all/);
});

test("unpaid membership payments disable accounts atomically in the bulk RPC", () => {
  const migrationPath = new URL(
    "../../../backend/supabase/migrations/078_disable_unpaid_organization_students.sql",
    import.meta.url,
  );
  const sql = readFileSync(fileURLToPath(migrationPath), "utf8");

  assert.match(sql, /IF p_paid THEN[\s\S]*?status = 'active'[\s\S]*?ELSE[\s\S]*?status = 'disabled'[\s\S]*?disabled_at = NOW\(\)[\s\S]*?account_status_reason = 'Membership disabled by organization'/);
});

test("activate and disable account actions update the expected lifecycle state", () => {
  assert.deepEqual(membershipActionChanges("activate", "2026-10-16T00:00:00.000Z"), {
    paidAt: undefined,
    userUpdate: { status: "active", disabled_at: null, account_status_reason: null },
  });
  assert.deepEqual(membershipActionChanges("disable", "2026-10-16T00:00:00.000Z"), {
    paidAt: undefined,
    userUpdate: {
      status: "disabled",
      disabled_at: "2026-10-16T00:00:00.000Z",
      account_status_reason: "Membership disabled by organization",
    },
  });
});

test("organization membership queries have table privileges for authenticated users", () => {
  const migrationPath = new URL(
    "../../../backend/supabase/migrations/075_organization_membership_read_grants.sql",
    import.meta.url,
  );
  const sql = readFileSync(fileURLToPath(migrationPath), "utf8");

  assert.match(
    sql,
    /GRANT\s+SELECT\s+ON(?:\s+TABLE)?\s+public\.organization_programs\s*,\s*public\.organization_memberships\s+TO\s+authenticated/i,
  );
});

test("walk-in payment RPC validates organization mapping and activates paid accounts atomically", () => {
  const migrationPath = new URL(
    "../../../backend/supabase/migrations/076_organization_membership_payment_actions.sql",
    import.meta.url,
  );
  const sql = readFileSync(fileURLToPath(migrationPath), "utf8");

  assert.match(sql, /record_organization_student_payment/i);
  assert.match(sql, /program_name_key\(s\.program\)\s*=\s*public\.program_name_key\(op\.program\)/i);
  assert.match(sql, /IF p_paid THEN\s+UPDATE public\.users/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION .* TO service_role/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION .* FROM PUBLIC, anon, authenticated/i);
});

test("membership API accepts payment status updates and requires explicit student IDs", () => {
  const routePath = new URL(
    "../src/app/api/org/memberships/route.ts",
    import.meta.url,
  );
  const source = readFileSync(fileURLToPath(routePath), "utf8");

  assert.match(source, /"mark_paid", "mark_unpaid", "activate", "disable"/);
  assert.match(source, /Select at least one student/);
  assert.match(source, /record_organization_students_payment/);
});

test("organization can mark all filtered students unpaid in one scoped payment update", () => {
  const routePath = new URL(
    "../src/app/api/org/memberships/route.ts",
    import.meta.url,
  );
  const panelPath = new URL(
    "../src/components/OrganizationMembershipPanel.tsx",
    import.meta.url,
  );
  const migrationPath = new URL(
    "../../../backend/supabase/migrations/077_bulk_organization_membership_payment_actions.sql",
    import.meta.url,
  );
  const route = readFileSync(fileURLToPath(routePath), "utf8");
  const panel = readFileSync(fileURLToPath(panelPath), "utf8");

  assert.equal(existsSync(migrationPath), true);
  assert.match(route, /record_organization_students_payment/);
  assert.match(route, /p_student_ids:\s*mappedStudentIds/);
  assert.match(panel, /Mark all as unpaid/);
  assert.match(panel, /update\("mark_unpaid",\s*paidIds\)/);
  assert.match(panel, /update\("mark_paid",\s*unpaidIds\)/);
  const migration = readFileSync(fileURLToPath(migrationPath), "utf8");
  assert.match(migration, /p_student_ids UUID\[\]/i);
  assert.match(migration, /array_agg\(DISTINCT s\.id\)/i);
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

test("filters membership reports by paid or unpaid status", () => {
  const students = [
    mappedPaidStudent,
    { ...mappedPaidStudent, student_id: "UNPAID-1", paid_at: null },
  ];

  assert.deepEqual(filterMembershipReport(students, { paidStatus: "paid" }), [mappedPaidStudent]);
  assert.deepEqual(filterMembershipReport(students, { paidStatus: "unpaid" }), [students[1]]);
  assert.deepEqual(filterMembershipReport(students, { paidStatus: "all" }), students);
});

test("membership panel offers one export menu and icon-only bulk payment actions", () => {
  const panelPath = new URL("../src/components/OrganizationMembershipPanel.tsx", import.meta.url);
  const exportPath = new URL("../src/components/ExportReportButtons.tsx", import.meta.url);
  const panel = readFileSync(fileURLToPath(panelPath), "utf8");
  const exportButtons = readFileSync(fileURLToPath(exportPath), "utf8");

  assert.match(panel, /aria-label="Filter by payment status"/);
  assert.match(panel, /Mark all as paid/);
  assert.match(exportButtons, /aria-label=\{exportLabel\}/);
  assert.match(exportButtons, /title=\{exportLabel\}/);
  assert.match(panel, /exportLabel="Export membership report"/);
  assert.match(exportButtons, /role="dialog"[^>]*aria-label="Choose report format"/);
  assert.match(exportButtons, /CSV spreadsheet/i);
  assert.match(exportButtons, /Excel workbook/i);
  assert.match(exportButtons, /PDF document/i);
  assert.doesNotMatch(panel, />Mark all as unpaid \(/);
});

test("event attendee reports use the single-icon format chooser", () => {
  const reportsPath = new URL("../src/app/dashboard/reports/page.tsx", import.meta.url);
  const reportsPage = readFileSync(fileURLToPath(reportsPath), "utf8");

  assert.match(reportsPage, /<ExportReportButtons[\s\S]*?compact[\s\S]*?exportLabel="Export event attendees"/);
});

test("searches membership reports by student name, ID, or program", () => {
  const students = [
    {
      ...mappedPaidStudent,
      student_id: "0123-4567",
      first_name: "Alex",
      last_name: "Reyes",
    },
    {
      ...mappedPaidStudent,
      student_id: "0765-4321",
      first_name: "Jordan",
      last_name: "Santos",
      program: "BSCS",
    },
  ];

  assert.deepEqual(filterMembershipReport(students, { search: "reyes" }), [students[0]]);
  assert.deepEqual(filterMembershipReport(students, { search: "0765" }), [students[1]]);
  assert.deepEqual(filterMembershipReport(students, { search: "bscs" }), [students[1]]);
});

test("accepts a location with low reported accuracy for server-side geofence validation", () => {
  assert.equal(hasUsableCoordinates(14.5995, 120.9842), true);
});
