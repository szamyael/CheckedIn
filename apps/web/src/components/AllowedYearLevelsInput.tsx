const YEAR_LEVELS = [1, 2, 3, 4, 5];

export function AllowedYearLevelsInput({
  value,
  onChange,
  compact = false,
}: {
  value: number[];
  onChange: (value: number[]) => void;
  compact?: boolean;
}) {
  function toggle(year: number) {
    onChange(
      value.includes(year)
        ? value.filter((item) => item !== year)
        : [...value, year].sort((a, b) => a - b),
    );
  }

  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-800">Eligible year levels</legend>
      <p className="mb-2 text-xs text-slate-500">Leave all unchecked to allow every student to check in.</p>
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {YEAR_LEVELS.map((year) => (
          <label key={year} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={value.includes(year)}
              onChange={() => toggle(year)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Year {year}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
