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
const studentIdCameraCapture = readFileSync(
  new URL("../src/components/student/IdCardCameraCapture.tsx", import.meta.url),
  "utf8",
);
const organizationModerationPanel = readFileSync(
  new URL("../src/components/OrganizationModerationPanel.tsx", import.meta.url),
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
  const groupedSelector =
    selector === ":root"
      ? /:root,\s*:root\[data-color-theme\]\s*\{([^}]*)\}/
      : selector === ':root[data-mode="dark"][data-color-theme]'
        ? /:root\[data-mode="dark"\],\s*:root\[data-mode="dark"\]\[data-color-theme\]\s*\{([^}]*)\}/
        : null;
  const body = groupedSelector?.exec(css)?.[1] ?? lastRule(selector);
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)
      .map((channel) => parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe("web soft-modern tokens", () => {
  it("defines shared action and status tokens for both modes", () => {
    const light = variables(":root");
    const dark = variables(':root[data-mode="dark"][data-color-theme]');
    for (const token of [
      "background",
      "surface",
      "surface-muted",
      "recessed",
      "border",
      "primary",
      "action-background",
      "action-foreground",
      "action-hover-background",
      "success",
      "warning",
      "error",
    ]) {
      assert.ok(light[token], `light theme must define --${token}`);
      assert.ok(dark[token], `dark theme must define --${token}`);
    }
    assert.equal(light.background, "#f7f8f7");
    assert.equal(light.surface, "#ffffff");
    assert.equal(light.recessed, "#f1f3f1");
    assert.equal(light.primary, "#42675b");
    assert.equal(light["radius-card"], "16px");
    assert.match(light["shadow-raised"], /0 2px 10px/);
    assert.equal(dark.background, "#1d2421");
    assert.equal(dark.primary, "#a3c5b6");
  });

  it("keeps normal semantic text at WCAG AA contrast on shared surfaces", () => {
    const light = variables(":root");
    const dark = variables(':root[data-mode="dark"][data-color-theme]');
    const semanticText = ["muted", "success", "warning", "error", "info"];

    for (const [mode, tokens, surfaces] of [
      [
        "light",
        light,
        [light.background, light.surface, light["surface-muted"], light.recessed],
      ],
      [
        "dark",
        dark,
        [dark.background, dark.surface, dark["surface-muted"], dark.recessed],
      ],
    ]) {
      for (const token of semanticText) {
        for (const surface of surfaces) {
          assert.ok(
            contrastRatio(tokens[token], surface) >= 4.5,
            `--${token} must meet WCAG AA in ${mode} mode on ${surface}`,
          );
        }
      }
    }
  });

  it("keeps text-field boundaries distinct from their surfaces", () => {
    const light = variables(":root");
    const dark = variables(':root[data-mode="dark"][data-color-theme]');

    for (const [mode, tokens] of [["light", light], ["dark", dark]]) {
      for (const surface of [
        tokens.background,
        tokens.surface,
        tokens["surface-muted"],
        tokens.recessed,
      ]) {
        assert.ok(
          contrastRatio(tokens["control-border"], surface) >= 3,
          `control borders must meet 3:1 in ${mode} mode on ${surface}`,
        );
      }
    }
  });

  it("keeps primary action labels readable in default and hover states", () => {
    const light = variables(":root");
    const dark = variables(':root[data-mode="dark"][data-color-theme]');

    for (const [mode, tokens] of [["light", light], ["dark", dark]]) {
      for (const surface of [tokens["action-background"], tokens["action-hover-background"]]) {
        assert.ok(
          contrastRatio(tokens["action-foreground"], surface) >= 4.5,
          `action text must meet WCAG AA in ${mode} mode on ${surface}`,
        );
      }
    }

    assert.match(
      css,
      /body :is\(button, a\)\[class\*="bg-\[var\(--primary\)\]"\],[\s\S]*?\{[^}]*color:\s*var\(--action-foreground\)\s*!important;[^}]*background:\s*var\(--action-background\)\s*!important;/,
    );
    assert.match(
      css,
      /body :is\(button, a\)\[class\*="bg-\[var\(--primary\)\]"\]:hover,[\s\S]*?\{[^}]*background:\s*var\(--action-hover-background\)\s*!important;/,
    );
  });
});

describe("shared web theme states", () => {
  it("uses opaque surfaces, restrained shadows, and no backdrop blur", () => {
    assert.match(css, /\.dashboard-workspace \.dashboard-sidebar,[\s\S]*?background:\s*var\(--surface\) !important/);
    assert.match(css, /backdrop-filter:\s*none !important/);
    assert.match(css, /--shadow-inset:\s*none/);
    assert.match(css, /--shadow-pressed:\s*none/);
  });

  it("defines warm-neutral surfaces, sage actions, and restrained elevation", () => {
    const root = variables(":root");
    assert.equal(root.background, "#f7f8f7");
    assert.equal(root.foreground, "#242927");
    assert.equal(root.surface, "#ffffff");
    assert.equal(root["action-background"], "#42675b");
    assert.equal(root["radius-card"], "16px");
    assert.equal(root["radius-control"], "12px");
    assert.equal(root["action-hover-background"], "#2f4d43");
    assert.match(root["shadow-raised"], /0 2px 10px/);
  });

  it("keeps text-field controls at the shared radius without restyling native inputs", () => {
    assert.match(
      css,
      /body :is\(input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\):not\(\[type="range"\]\):not\(\[type="color"\]\):not\(\[type="hidden"\]\), select, textarea\) \{[^}]*border-radius:\s*var\(--radius-control\)\s*!important;/,
    );
    assert.match(css, /:focus-visible \{\s*outline:\s*2px solid var\(--primary\)/);
  });

  it("does not add hover feedback to static dashboard and student cards", () => {
    assert.doesNotMatch(
      css,
      /\.dashboard-workspace \.dashboard-stat-card:hover|\.student-portal \.student-stat-card:hover/,
    );
    assert.doesNotMatch(
      css,
      /body :is\(main, section, article, aside, form, div\)\[class\*="rounded-"\]\[class\*="border"\]:hover/,
    );
    assert.match(css, /\.student-portal :is\(a, button\)\.student-card:hover/);
  });

  it("defaults the shared web theme to light mode", () => {
    const provider = readFileSync(
      new URL("../src/components/ThemeProvider.tsx", import.meta.url),
      "utf8",
    );
    assert.match(provider, /return "light"/);
    assert.match(provider, /\?\? "light"/);
  });

  it("uses the semantic error color for dashboard destructive text actions", () => {
    assert.match(
      rule(".dashboard-workspace :is(button, a).text-red-700"),
      /color:\s*var\(--error\)/,
    );
  });

  it("keeps staff sign-in hero text light on its teal panel", () => {
    assert.match(staffLoginPage, /staff-login-hero/);
    assert.match(
      rule(".staff-login-hero :is(h1, h2, h3, p)"),
      /color:\s*var\(--action-foreground\)/,
    );
  });

  it("keeps disabled ID capture text readable without opacity fading", () => {
    assert.ok(studentIdCameraCapture.includes("disabled={"));
    const disabledAction = css.match(
      /body :is\(button, a\)\[class\*="bg-\[var\(--action-background\)\]"\]:disabled,\s*body :is\(button, a\)\[class\*="bg-\[var\(--primary\)\]"\]:disabled \{([^}]*)\}/,
    )?.[1];
    assert.ok(disabledAction, "expected a shared disabled action rule");
    assert.match(disabledAction, /color:\s*var\(--muted\)\s*!important/);
    assert.match(disabledAction, /background:\s*var\(--surface-muted\)\s*!important/);
    assert.match(disabledAction, /opacity:\s*1\s*!important/);
  });

  it("uses contrast-safe action colors for dashboard primary buttons", () => {
    const actionRule = rule(
      '.dashboard-workspace :is([class~="bg-teal-600"], [class~="bg-teal-700"], [class~="bg-blue-600"], [class~="bg-blue-700"], [class~="bg-indigo-600"], [class~="bg-indigo-700"])',
    );
    assert.match(actionRule, /background-color:\s*var\(--action-background\)/);
    assert.match(actionRule, /color:\s*var\(--action-foreground\)/);
  });

  it("keeps keyboard focus visible at the active theme accent", () => {
    assert.match(css, /:is\(a, button, input, select, textarea\):focus-visible/);
    assert.match(css, /outline:\s*2px solid var\(--accent\)/);
  });

  it("keeps the brand mark crisp against the white sidebar", () => {
    assert.match(
      css,
      /:root:not\(\[data-mode="dark"\]\) \.dashboard-workspace \.dashboard-sidebar-brand img,[\s\S]*?:root:not\(\[data-mode="dark"\]\) \.student-portal \.student-sidebar > div:first-child img \{\s*filter:\s*none;/,
    );
    assert.match(
      css,
      /:root\[data-mode="dark"\] \.dashboard-workspace \.dashboard-sidebar-brand img,[\s\S]*?:root\[data-mode="dark"\] \.student-portal \.student-sidebar > div:first-child img \{\s*filter:\s*brightness\(0\) invert\(1\)/,
    );
  });

  it("keeps the selected organization moderation filter readable", () => {
    assert.match(organizationModerationPanel, /aria-pressed=\{filter === status\}/);
    assert.match(organizationModerationPanel, /moderation-filter/);
    assert.match(
      organizationModerationPanel,
      /bg-\[var\(--action-background\)\] text-\[var\(--action-foreground\)\]/,
    );
    assert.match(
      rule('.dashboard-workspace .moderation-filter[aria-pressed="true"]'),
      /color:\s*var\(--action-foreground\)\s*!important/,
    );
    assert.match(
      rule('.dashboard-workspace .moderation-filter[aria-pressed="true"]'),
      /background-color:\s*var\(--action-background\)\s*!important/,
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

  it("shows registration review confirmation before email verification", () => {
    assert.match(studentRegisterPage, /setRegistrationComplete\(true\)/);
    assert.match(studentRegisterPage, /role="dialog"[\s\S]*aria-modal="true"/);
    assert.match(studentRegisterPage, /Registration complete/);
    assert.match(studentRegisterPage, /Your account is under review/);
    assert.match(studentRegisterPage, /Continue to email verification/);
    assert.match(
      studentRegisterPage,
      /\/student\/verify-email\?email=\$\{encodeURIComponent\(draft\.email\.trim\(\)\.toLowerCase\(\)\)\}/,
    );
  });

  it("removes white highlight glows from shared shadows", () => {
    const shadowTokens = [...css.matchAll(/--shadow-[\w-]+:\s*([^;]+);/g)];
    assert.ok(shadowTokens.length > 0);
    for (const [, shadow] of shadowTokens) {
      assert.doesNotMatch(shadow, /#fff(?:fff)?\b|255\s+255\s+255/i);
    }
    assert.doesNotMatch(
      css,
      /box-shadow:[^;]*inset[^;]*rgb\(255 255 255/i,
    );
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
