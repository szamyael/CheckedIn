import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
