import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const loggedRoutes = [
  ["../src/app/api/student-programs/route.ts", "GET"],
  ["../src/app/api/places/search/route.ts", "GET"],
  ["../src/app/api/places/reverse/route.ts", "GET"],
  ["../src/app/api/admin/create-organization/route.ts", "POST"],
  ["../src/app/api/admin/organization-programs/route.ts", "POST"],
  ["../src/app/api/admin/organization-programs/route.ts", "PATCH"],
  ["../src/app/api/admin/organization-programs/route.ts", "DELETE"],
  ["../src/app/api/admin/students/[id]/route.ts", "PATCH"],
  ["../src/app/api/org/memberships/route.ts", "POST"],
  ["../src/app/api/admin/organizations/moderation/route.ts", "PATCH"],
  ["../src/app/api/admin/users/[id]/route.ts", "PATCH"],
  ["../src/app/api/admin/users/[id]/route.ts", "DELETE"],
  ["../src/app/api/admin/users/batch/route.ts", "POST"],
  ["../src/app/api/admin/create-staff/route.ts", "POST"],
  ["../src/app/api/admin/bootstrap/route.ts", "GET"],
  ["../src/app/api/admin/bootstrap/route.ts", "POST"],
];

describe("admin API monitor", () => {
  it("records every web API handler using route templates", () => {
    for (const [path, method] of loggedRoutes) {
      const route = source(path);
      assert.match(route, /import \{ withApiLogging \} from "@\/lib\/api-monitor"/);
      assert.match(route, new RegExp(`export const ${method} = withApiLogging\\(`));
    }
  });

  it("stores metadata only and limits the monitor to admin access", () => {
    const logger = source("../src/lib/api-monitor.ts");
    const route = source("../src/app/api/admin/monitor/route.ts");
    const migration = source(
      "../../../backend/supabase/migrations/088_api_request_monitor.sql",
    );

    assert.match(logger, /method: entry\.method/);
    assert.match(logger, /path: entry\.path/);
    assert.match(logger, /status_code: entry\.statusCode/);
    assert.match(logger, /duration_ms: entry\.durationMs/);
    assert.doesNotMatch(logger, /request\.url|request\.headers|request\.text|request\.json/);
    assert.match(route, /if \(profile\?\.role !== "admin"\)/);
    assert.match(route, /\.from\("system_settings"\)/);
    assert.match(route, /\.limit\(100\)/);
    assert.match(route, /"Cache-Control": "no-store"/);
    assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
    assert.match(migration, /current_user_role\(\) = 'admin'/);
    assert.match(migration, /INTERVAL '30 days'/);
  });

  it("draws a heartbeat pulse from each measured database response time", () => {
    const monitor = source("../src/components/AdminApiMonitor.tsx");
    const styles = source("../src/app/globals.css");
    assert.match(monitor, /setHeartbeatSamples/);
    assert.match(monitor, /Math\.min\(Math\.max\(latency, 0\), 1000\)/);
    assert.match(monitor, /className="heartbeat-trace-scroll"/);
    assert.match(monitor, /viewBox="0 0 160 36"/);
    assert.match(monitor, /latest response \$\{data\?\.heartbeat\.latencyMs/);
    assert.match(monitor, /\[\.\.\.samples, null\]\.slice\(-6\)/);
    assert.match(styles, /animation: heartbeat-trace-scroll 5s linear infinite/);
    assert.match(styles, /to \{ transform: translateX\(-50%\); \}/);
    assert.match(styles, /\.heartbeat-trace-scroll \{\s*animation: none;/);
  });

  it("limits the main API table to five and the scrollable dialog to twenty calls", () => {
    const monitor = source("../src/components/AdminApiMonitor.tsx");
    assert.match(monitor, /logs=\{\(data\?\.logs \?\? \[\]\)\.slice\(0, 5\)\}/);
    assert.match(monitor, /logs=\{\(data\?\.logs \?\? \[\]\)\.slice\(0, 20\)\}/);
    assert.match(monitor, /View more \(20\)/);
    assert.match(monitor, /role="dialog"\s+aria-modal="true"/);
    assert.match(monitor, /Showing the 20 most recent calls\./);
    assert.match(monitor, /className="overflow-auto p-4"/);
    assert.match(monitor, /event\.key === "Escape"/);
  });

  it("reveals analytics from zero and respects reduced-motion settings", () => {
    const charts = source("../src/components/AnalyticsCharts.tsx");
    assert.match(charts, /useState\(false\)/);
    assert.match(charts, /setRevealed\(true\)/);
    assert.match(charts, /revealed \? point\.value : 0/);
    assert.match(charts, /revealed \? d\.value : 0/);
    assert.match(charts, /isAnimationActive=\{!reducedMotion\}/);
  });
});
