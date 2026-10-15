import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const stylesheetPath = new URL("../src/app/globals.css", import.meta.url);
const stylesheet = readFileSync(fileURLToPath(stylesheetPath), "utf8");

test("web route transitions retain a short fade when reduced motion is enabled", () => {
  assert.match(stylesheet, /\.route-transition\s*\{[^}]*route-enter/);
  assert.match(
    stylesheet,
    /\.route-transition\s*\{[^}]*route-enter-reduced\s+150ms/,
  );
  assert.match(
    stylesheet,
    /@keyframes route-enter-reduced\s*\{\s*from\s*\{\s*opacity:\s*0;\s*\}\s*to\s*\{\s*opacity:\s*1;\s*\}\s*\}/,
  );
});

test("web controls across routes receive consistent press feedback", () => {
  assert.match(stylesheet, /:root :is\(button, a\)\s*\{[^}]*opacity[^}]*transform/);
  assert.match(
    stylesheet,
    /:root :is\(button, a\):active\s*\{[^}]*opacity[^}]*transform/,
  );
});
