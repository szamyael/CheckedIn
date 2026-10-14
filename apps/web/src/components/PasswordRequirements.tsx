"use client";

const rules = [
  { label: "Special characters", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  { label: "At least 2 numbers", test: (value: string) => (value.match(/\d/g) ?? []).length >= 2 },
  { label: "One uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "8 password length", test: (value: string) => value.length >= 8 },
] as const;

export function passwordRules(value: string) {
  return rules.map((rule) => ({ ...rule, met: rule.test(value) }));
}

export function PasswordRequirements({ value }: { value: string }) {
  const evaluated = passwordRules(value);
  const metCount = evaluated.filter((rule) => rule.met).length;
  const strength = value.length === 0 ? 0 : metCount;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][strength];

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex flex-wrap gap-1.5">
        {evaluated.map((rule) => (
          <span
            key={rule.label}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              rule.met
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {rule.met ? "✓ " : ""}{rule.label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1" aria-label={`Password strength: ${strengthLabel || "Not set"}`}>
          {[1, 2, 3, 4].map((segment) => (
            <span key={segment} className={`h-full flex-1 rounded-full ${segment <= strength ? strengthColor : "bg-slate-200"}`} />
          ))}
        </div>
        {strengthLabel && <span className="text-[11px] font-semibold text-slate-600">{strengthLabel}</span>}
      </div>
    </div>
  );
}
