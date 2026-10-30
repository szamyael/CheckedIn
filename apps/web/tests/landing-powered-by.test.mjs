import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const landingPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("landing page explains the technologies that power CheckedIn", () => {
  assert.match(landingPage, /import \{ ThemePanelButton \} from "@\/components\/ThemePanelButton"/);
  assert.match(landingPage, /<ThemePanelButton \/>/);
  assert.match(landingPage, /aria-labelledby="powered-by-heading"/);
  assert.match(landingPage, /id="powered-by-heading"[\s\S]*?>[\s\S]*?The tools behind CheckedIn/);

  for (const technology of [
    "Vercel",
    "Supabase",
    "React + Next.js",
    "TypeScript",
    "Flutter",
    "Veryfi",
    "Leaflet + OpenStreetMap",
    "OneSignal",
    "Tailwind CSS",
  ]) {
    assert.ok(landingPage.includes(`name: "${technology}"`), `${technology} should be listed`);
  }

  assert.match(landingPage, /description: "Reads student ID details during registration with OCR\."/);
  assert.match(landingPage, /description: "Provides interactive venue maps and location context\."/);
  assert.match(landingPage, /poweredBy\.map\(\(\{ name, description, icon: Icon \}\)/);
  assert.match(landingPage, /<Icon size=\{22\} aria-hidden="true" \/>/);
});

test("technology cards scroll horizontally as a compact carousel", () => {
  assert.match(landingPage, /aria-label="Technology carousel"/);
  assert.match(landingPage, /powered-by-carousel min-w-0 overflow-x-auto/);
  assert.match(landingPage, /w-\[17rem\] items-center/);
  assert.doesNotMatch(landingPage, /mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3/);
});

test("technology carousel flows continuously, pauses for interaction, and respects reduced motion", () => {
  assert.match(landingPage, /className="powered-by-track flex w-max"/);
  assert.match(landingPage, /aria-hidden=\{duplicate \|\| undefined\}[\s\S]*?poweredBy\.map/);
  assert.match(css, /@keyframes powered-by-flow/);
  assert.match(css, /\.powered-by-track\s*\{[^}]*animation:\s*powered-by-flow/);
  assert.match(css, /\.powered-by-carousel:is\(:hover, :focus-within, :active\) \.powered-by-track/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*?\.powered-by-track\s*\{[^}]*animation:\s*none/);
});
