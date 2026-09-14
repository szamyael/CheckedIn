"use client";

import { useState } from "react";

const presets = [50, 100, 150] as const;

export function CheckInRadiusInput({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  const [customMode, setCustomMode] = useState(!presets.includes(value as (typeof presets)[number]));
  const [customValue, setCustomValue] = useState(customMode ? String(value) : "");

  const selectPreset = (preset: number) => { setCustomMode(false); setCustomValue(""); onChange(preset); };
  const selectCustom = () => { setCustomMode(true); setCustomValue(""); };
  const updateCustomRadius = (rawValue: string) => {
    setCustomValue(rawValue);
    const parsed = Number(rawValue);
    if (Number.isInteger(parsed) && parsed >= 10 && parsed <= 5000) onChange(parsed);
  };

  return <div>
    <div className="mb-3 grid max-w-sm grid-cols-4 gap-2" aria-label="Check-in radius presets">
      {presets.map((preset) => <button key={preset} type="button" onClick={() => selectPreset(preset)} className={`rounded-xl border py-3 text-sm font-bold tabular-nums transition ${!customMode && value === preset ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}><span>{preset}</span><span className="ml-0.5 text-[10px] font-medium opacity-70">m</span></button>)}
      <button type="button" onClick={selectCustom} className={`rounded-xl border py-3 text-xs font-bold transition ${customMode ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}>Custom</button>
    </div>
    {customMode && <><label className="sr-only" htmlFor={compact ? "edit-custom-check-in-radius" : "custom-check-in-radius"}>Custom check-in radius in meters</label><div className="relative max-w-44"><input id={compact ? "edit-custom-check-in-radius" : "custom-check-in-radius"} type="number" autoFocus value={customValue} onChange={(event) => updateCustomRadius(event.target.value)} min={10} max={5000} required placeholder="Enter meters" className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm" /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-500">m</span></div></>}
    {!compact && <p className="mt-1.5 text-xs text-slate-500">Choose a preset or enter a custom radius from 10 m to 5,000 m.</p>}
  </div>;
}
