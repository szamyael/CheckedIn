"use client";

import {
  type EventScheduleFields,
  type EventScheduleValidation,
  validateEventSchedule,
} from "@/lib/event-form";

interface EventScheduleFieldsProps {
  value: EventScheduleFields;
  onChange: (value: EventScheduleFields) => void;
  attendanceCustomized: boolean;
  onAttendanceCustomizedChange: (customized: boolean) => void;
  compact?: boolean;
}

const inputClass = (compact?: boolean) =>
  compact
    ? "w-full rounded border border-slate-300 px-2 py-1 text-sm"
    : "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export function EventScheduleFieldsInput({
  value,
  onChange,
  attendanceCustomized,
  onAttendanceCustomizedChange,
  compact = false,
}: EventScheduleFieldsProps) {
  const validation: EventScheduleValidation = validateEventSchedule(value);
  const cls = inputClass(compact);

  function updateStartsAt(startsAt: string) {
    const next = { ...value, startsAt };
    onChange(
      attendanceCustomized ? next : { ...next, attendanceStartsAt: startsAt },
    );
  }

  function updateEndsAt(endsAt: string) {
    const next = { ...value, endsAt };
    onChange(
      attendanceCustomized ? next : { ...next, attendanceEndsAt: endsAt },
    );
  }

  function updateAttendanceStartsAt(attendanceStartsAt: string) {
    onAttendanceCustomizedChange(true);
    onChange({ ...value, attendanceStartsAt });
  }

  function updateAttendanceEndsAt(attendanceEndsAt: string) {
    onAttendanceCustomizedChange(true);
    onChange({ ...value, attendanceEndsAt });
  }

  function resetAttendanceSync() {
    onAttendanceCustomizedChange(false);
    onChange({
      ...value,
      attendanceStartsAt: value.startsAt,
      attendanceEndsAt: value.endsAt,
    });
  }

  return (
    <div className="space-y-4">
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Event starts
          </label>
          <input
            type="datetime-local"
            required
            value={value.startsAt}
            onChange={(e) => updateStartsAt(e.target.value)}
            className={cls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Event ends
          </label>
          <input
            type="datetime-local"
            required
            value={value.endsAt}
            min={value.startsAt || undefined}
            onChange={(e) => updateEndsAt(e.target.value)}
            className={cls}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">Check-in window</p>
          {attendanceCustomized ? (
            <button
              type="button"
              onClick={resetAttendanceSync}
              className="text-xs text-blue-600 hover:underline"
            >
              Match event times
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Synced with event schedule
            </span>
          )}
        </div>
        <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Attendance opens
            </label>
            <input
              type="datetime-local"
              required
              value={value.attendanceStartsAt}
              onChange={(e) => updateAttendanceStartsAt(e.target.value)}
              className={cls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Attendance closes (QR expires)
            </label>
            <input
              type="datetime-local"
              required
              value={value.attendanceEndsAt}
              min={value.attendanceStartsAt || undefined}
              onChange={(e) => updateAttendanceEndsAt(e.target.value)}
              className={cls}
            />
          </div>
        </div>
      </div>

      {!validation.valid && (
        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {validation.errors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
