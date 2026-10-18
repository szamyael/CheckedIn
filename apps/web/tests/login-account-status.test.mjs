import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("non-active student statuses open the account status dialog", () => {
  const loginPath = new URL("../src/app/login/page.tsx", import.meta.url);
  const source = readFileSync(fileURLToPath(loginPath), "utf8");

  assert.match(source, /profile\.role === "student" && profile\.status !== "active"/);
  assert.match(source, /setAccountDecision\(\{\s*status: profile\.status/);
});

test("account status dialog directs students to the Department's Organization Office", () => {
  const dialogPath = new URL(
    "../src/components/student/StudentAccountDecisionDialog.tsx",
    import.meta.url,
  );
  const source = readFileSync(fileURLToPath(dialogPath), "utf8");

  assert.match(source, /Department(?:'|&apos;)s Organization Office/);
  assert.match(source, /decision\.status/);
  assert.match(source, /decision\.reason/);
});

test("suspended portal sessions reach the student dialog with their status reason", () => {
  const middleware = read("../src/lib/supabase/middleware.ts");
  const login = read("../src/app/student/login/page.tsx");

  assert.match(
    middleware,
    /isStudent &&[\s\S]*?profile\?\.status === "suspended" &&[\s\S]*?!isPublicPath\(path\)[\s\S]*?url\.pathname = "\/student\/login"[\s\S]*?NextResponse\.redirect\(url\)/,
  );
  assert.match(
    middleware,
    /isStudent &&[\s\S]*?profile\?\.status === "active" &&\s*isStudentAuthPath\(path\)/,
  );
  assert.match(
    login,
    /useEffect\([\s\S]*?supabase\.auth\.getUser\(\)[\s\S]*?profile\.status === "suspended"[\s\S]*?setAccountDecision\(\{\s*status: profile\.status,\s*reason: profile\.account_status_reason/,
  );
});
