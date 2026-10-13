import assert from "node:assert/strict";
import { test } from "node:test";

const { handleLegacyResetPassword } = await import("./handler.ts").catch(
  () => ({}),
);

test("legacy direct password reset endpoint is disabled", async () => {
  assert.equal(
    typeof handleLegacyResetPassword,
    "function",
    "handler.ts must export handleLegacyResetPassword",
  );
  const response = handleLegacyResetPassword(
    new Request("https://example.test", { method: "POST" }),
  );
  assert.equal(response.status, 410);
  assert.match((await response.json()).error, /disabled/i);
});
