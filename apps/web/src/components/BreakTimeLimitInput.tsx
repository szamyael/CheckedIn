"use client";

import { useState } from "react";

const presets = [
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
] as const;

export function BreakTimeLimitInput({
  value,
  onChange,
  compact = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  compact?: boolean;
}) {
  const matchedPreset = presets.find((preset) => preset.minutes === value);
  const [customMode, setCustomMode] = useState(value != null && !matchedPreset);
  const [customHours, setCustomHours] = useState(
    customMode && value != null ? String(Math.round((value / 60) * 100) / 100) : "",
  );

  const selectNone = () => {
    setCustomMode(false);
    setCustomHours("");
    onChange(null);
  };

  const selectPreset = (minutes: number) => {
    setCustomMode(false);
    setCustomHours("");
    onChange(minutes);
  };

  const selectCustom = () => {
    setCustomMode(true);
    setCustomHours(value != null && !matchedPreset ? String(Math.round((value / 60) * 100) / 100) : "");
  };

  const updateCustomHours = (rawValue: string) => {
    setCustomHours(rawValue);
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const minutes = Math.round(parsed * 60);
    if (minutes >= 1 && minutes <= 1440) onChange(minutes);
  };

  return (
    <div>
      <div className="mb-3 grid max-w-lg grid-cols-4 gap-2" aria-label="Break time limit presets">
        <button
          type="button"
          onClick={selectNone}
          className={`rounded-xl border py-3 text-xs font-bold transition ${
            value == null && !customMode
              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          None
        </button>
        {presets.map((preset) => (
          <button
            key={preset.minutes}
            type="button"
            onClick={() => selectPreset(preset.minutes)}
            className={`rounded-xl border py-3 text-sm font-bold tabular-nums transition ${
              !customMode && value === preset.minutes
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={selectCustom}
        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
          customMode
            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        Custom hours
      </button>
      {customMode && (
        <div className="relative mt-3 max-w-44">
          <label className="sr-only" htmlFor={compact ? "edit-custom-break-limit" : "custom-break-limit"}>
            Custom break time limit in hours
          </label>
          <input
            id={compact ? "edit-custom-break-limit" : "custom-break-limit"}
            type="number"
            min={0.25}
            max={24}
            step={0.25}
            autoFocus
            value={customHours}
            onChange={(event) => updateCustomHours(event.target.value)}
            required
            placeholder="e.g. 2"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 text-sm"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-500">
            hrs
          </span>
        </div>
      )}
      {!compact && (
        <p className="mt-1.5 text-xs text-slate-500">
          After a student breaks out, they must return within this time. Once it ends they can no longer break in or check out.
        </p>
      )}
    </div>
  );
}
