import assert from "node:assert/strict";
import { test } from "node:test";

const { isBootstrapSecretValid } = await import("./bootstrap-secret.ts").catch(
  () => ({}),
);

test("bootstrap requires a configured high-entropy matching secret", () => {
  assert.equal(
    typeof isBootstrapSecretValid,
    "function",
    "bootstrap-secret.ts must export isBootstrapSecretValid",
  );
  assert.equal(isBootstrapSecretValid(undefined, "a".repeat(32)), false);
  assert.equal(isBootstrapSecretValid("short", "short"), false);
  assert.equal(isBootstrapSecretValid("a".repeat(32), "b".repeat(32)), false);
  assert.equal(isBootstrapSecretValid("a".repeat(32), "a".repeat(32)), true);
});
