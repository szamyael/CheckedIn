import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const landingPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const verifyEmailPage = readFileSync(
  new URL("../src/app/student/verify-email/VerifyEmailInner.tsx", import.meta.url),
  "utf8",
);
const staffLoginPage = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
const studentLoginPage = readFileSync(
  new URL("../src/app/student/login/page.tsx", import.meta.url),
  "utf8",
);
const studentOnboardingPage = readFileSync(
  new URL("../src/app/student/onboarding/page.tsx", import.meta.url),
  "utf8",
);
const studentRegisterPage = readFileSync(
  new URL("../src/app/student/register/page.tsx", import.meta.url),
  "utf8",
);
const studentForgotPage = readFileSync(
  new URL("../src/app/student/forgot-password/page.tsx", import.meta.url),
  "utf8",
);
const studentForgotCodePage = readFileSync(
  new URL("../src/app/student/forgot-password/code/page.tsx", import.meta.url),
  "utf8",
);
const studentTermsPage = readFileSync(
  new URL("../src/app/student/terms/page.tsx", import.meta.url),
  "utf8",
);
const studentEventsPage = readFileSync(
  new URL("../src/app/student/(app)/events/[id]/page.tsx", import.meta.url),
  "utf8",
);
const studentProfilePage = readFileSync(
  new URL("../src/app/student/(app)/profile/page.tsx", import.meta.url),
  "utf8",
);
const staffForgotPage = readFileSync(
  new URL("../src/app/forgot-password/page.tsx", import.meta.url),
  "utf8",
);
const staffResetPage = readFileSync(
  new URL("../src/app/auth/reset-password/page.tsx", import.meta.url),
  "utf8",
);
const passwordRequirements = readFileSync(
  new URL("../src/components/PasswordRequirements.tsx", import.meta.url),
  "utf8",
);

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected CSS rule for ${selector}`);
  return match[1];
}

function lastRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))];
  assert.ok(matches.length, `Expected CSS rule for ${selector}`);
  return matches[matches.length - 1][1];
}

function variables(selector) {
  return Object.fromEntries(
    [...rule(selector).matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

describe("web palette tokens", () => {
  const palettes = [
    "navy",
    "violet",
    "orange",
    "maroon",
    "army-green",
    "black",
    "grey",
  ];
  const paletteTokens = [
    "background",
    "surface",
    "surface-muted",
    "border",
    "primary",
    "primary-strong",
    "primary-soft",
    "accent",
  ];

  for (const palette of palettes) {
    for (const mode of ["light", "dark"]) {
      it(`defines all shared colors for ${palette} ${mode} mode`, () => {
        const selector =
          mode === "dark"
            ? `:root[data-mode="dark"][data-color-theme="${palette}"]`
            : `:root[data-color-theme="${palette}"]`;
        const defined = variables(selector);
        for (const token of paletteTokens) {
          assert.ok(defined[token], `${selector} must define --${token}`);
        }
      });
    }
  }

  it("defines shared action and status tokens for both modes", () => {
    const light = variables(":root");
    const dark = variables(':root[data-mode="dark"]');
    for (const token of [
      "action-background",
      "action-foreground",
      "success",
      "warning",
      "error",
    ]) {
      assert.ok(light[token], `light theme must define --${token}`);
      assert.ok(dark[token], `dark theme must define --${token}`);
    }
  });
});

describe("shared web theme states", () => {
  it("uses a contrast-safe action surface for the dashboard sidebar", () => {
    assert.match(
      rule(".dashboard-workspace .dashboard-sidebar"),
      /background:\s*var\(--action-background\)/,
    );
  });

  it("uses the semantic error color for dashboard destructive text actions", () => {
    assert.match(
      rule(".dashboard-workspace :is(button, a).text-red-700"),
      /color:\s*var\(--error\)/,
    );
  });

  it("uses contrast-safe action colors for dashboard primary buttons", () => {
    const actionRule = rule(
      '.dashboard-workspace :is([class~="bg-teal-600"], [class~="bg-teal-700"], [class~="bg-blue-600"], [class~="bg-blue-700"], [class~="bg-indigo-600"], [class~="bg-indigo-700"])',
    );
    assert.match(actionRule, /background-color:\s*var\(--action-background\)/);
    assert.match(actionRule, /color:\s*var\(--action-foreground\)/);
  });

  it("keeps keyboard focus outlines at the active theme accent", () => {
    assert.match(
      rule(":focus-visible"),
      /outline:\s*3px solid var\(--accent\)/,
    );
  });

  it("keeps dashboard branding visible against the themed sidebar", () => {
    assert.match(
      lastRule(".dashboard-workspace .dashboard-sidebar-brand img"),
      /filter:.*brightness\(0\).*invert\(1\)/,
    );
  });
});

describe("web route theme usage", () => {
  it("uses semantic theme tokens throughout the public landing page", () => {
    assert.doesNotMatch(landingPage, /#[\da-f]{3,8}\b|rgba?\(/i);
    assert.match(landingPage, /bg-\[var\(--background\)\]/);
    assert.match(landingPage, /bg-\[var\(--action-background\)\]/);
  });

  it("uses theme-aware form and message styles on the student email verification page", () => {
    assert.doesNotMatch(verifyEmailPage, /bg-white|text-slate-|border-slate-|bg-slate-|text-teal-|bg-teal-/);
  });

  it("uses semantic theme colors on staff and student sign-in screens", () => {
    for (const [name, page] of [
      ["staff sign-in", staffLoginPage],
      ["student sign-in", studentLoginPage],
    ]) {
      assert.doesNotMatch(page, /#[\da-f]{3,8}\b|rgba?\(/i, `${name} should not pin colors`);
      assert.match(page, /bg-\[var\(--action-background\)\]/, `${name} needs a themed primary action`);
    }
  });

  it("uses semantic theme colors throughout student onboarding", () => {
    assert.doesNotMatch(studentOnboardingPage, /#[\da-f]{3,8}\b|rgba?\(/i);
    assert.match(studentOnboardingPage, /bg-\[var\(--action-background\)\]/);
  });

  it("scopes student guest routes to shared semantic utility mappings", () => {
    for (const [name, page] of [
      ["student sign-in", studentLoginPage],
      ["registration", studentRegisterPage],
      ["password reset", studentForgotPage],
      ["password reset code", studentForgotCodePage],
      ["terms", studentTermsPage],
      ["staff password recovery", staffForgotPage],
      ["staff password reset", staffResetPage],
    ]) {
      assert.match(page, /auth-theme/, `${name} should opt into shared theme mapping`);
    }
    assert.match(css, /\.auth-theme \[class~="bg-white"\]/);
    assert.match(css, /\.auth-theme :is\(\[class~="bg-teal-600"\]/);
    assert.match(css, /\.auth-theme :is\([^)]*\[class~="bg-blue-600"\]/);
    assert.match(css, /\.auth-theme :is\(\[class~="text-slate-600"\]/);
  });

  it("uses semantic colors for password strength and requirement states", () => {
    assert.doesNotMatch(passwordRequirements, /\b(?:bg|text|border)-(?:slate|emerald|red|amber|blue)-/);
    for (const token of ["success", "warning", "error", "primary", "border", "surface-muted", "muted"]) {
      assert.ok(passwordRequirements.includes(`var(--${token})`), `password requirements should use --${token}`);
    }
  });

  it("uses theme-aware disabled styling for student event actions", () => {
    assert.match(studentEventsPage, /aria-disabled=\{!isOpen\}/);
    assert.match(css, /\.student-portal \[aria-disabled="true"\]/);
    assert.match(rule('.student-portal [aria-disabled="true"]'), /background-color:\s*var\(--surface-muted\)/);
    assert.match(rule('.student-portal [aria-disabled="true"]'), /color:\s*var\(--muted\)/);
  });

  it("uses semantic theme colors for student profile fallback and upload controls", () => {
    assert.match(studentProfilePage, /bg-\[var\(--surface-muted\)\]/);
    assert.match(studentProfilePage, /text-\[var\(--foreground\)\]/);
    assert.match(
      studentProfilePage,
      /border-\[var\(--action-foreground\)\] bg-\[var\(--action-background\)\] text-\[var\(--action-foreground\)\]/,
    );
    assert.doesNotMatch(studentProfilePage, /bg-\[#e7eef4\]|text-\[#17324d\]|border-\[#17324d\]|bg-\[#c18a2e\]/i);
  });
});
