/** Helpers for event create/edit forms (datetime-local + DB constraints). */

export interface EventScheduleFields {
  startsAt: string;
  endsAt: string;
  attendanceStartsAt: string;
  attendanceEndsAt: string;
}

export interface EventScheduleValidation {
  valid: boolean;
  errors: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO / Date → `datetime-local` value in local timezone. */
export function toLocalDatetimeInputValue(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` string → Date (local), or null if empty/invalid. */
export function parseLocalDatetimeInput(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function roundUpToNextHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  if (d.getTime() <= date.getTime()) {
    d.setHours(d.getHours() + 1);
  }
  return d;
}

/** Sensible defaults: next rounded hour + 2h event, attendance mirrors event. */
export function defaultEventSchedule(): EventScheduleFields {
  const start = roundUpToNextHour(new Date());
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  const startsAt = toLocalDatetimeInputValue(start);
  const endsAt = toLocalDatetimeInputValue(end);

  return {
    startsAt,
    endsAt,
    attendanceStartsAt: startsAt,
    attendanceEndsAt: endsAt,
  };
}

export function validateEventSchedule(
  fields: EventScheduleFields,
): EventScheduleValidation {
  const errors: string[] = [];

  const starts = parseLocalDatetimeInput(fields.startsAt);
  const ends = parseLocalDatetimeInput(fields.endsAt);
  const attStart = parseLocalDatetimeInput(fields.attendanceStartsAt);
  const attEnd = parseLocalDatetimeInput(fields.attendanceEndsAt);

  if (!starts) errors.push("Event start date and time is required.");
  if (!ends) errors.push("Event end date and time is required.");
  if (!attStart) errors.push("Attendance open time is required.");
  if (!attEnd) errors.push("Attendance close time is required.");

  if (starts && ends && ends.getTime() <= starts.getTime()) {
    errors.push("Event end must be after event start.");
  }

  if (attStart && attEnd && attEnd.getTime() <= attStart.getTime()) {
    errors.push(
      "Attendance close must be after attendance open (check-in window cannot be zero or negative).",
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Sync attendance window to event times (used when user has not customized attendance). */
export function syncAttendanceToEvent(
  fields: EventScheduleFields,
): EventScheduleFields {
  return {
    ...fields,
    attendanceStartsAt: fields.startsAt,
    attendanceEndsAt: fields.endsAt,
  };
}

export function scheduleFieldsToIso(fields: EventScheduleFields) {
  const starts = parseLocalDatetimeInput(fields.startsAt);
  const ends = parseLocalDatetimeInput(fields.endsAt);
  const attStart = parseLocalDatetimeInput(fields.attendanceStartsAt);
  const attEnd = parseLocalDatetimeInput(fields.attendanceEndsAt);

  if (!starts || !ends || !attStart || !attEnd) {
    throw new Error("Invalid schedule fields");
  }

  return {
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    attendance_starts_at: attStart.toISOString(),
    attendance_ends_at: attEnd.toISOString(),
    qr_expires_at: attEnd.toISOString(),
  };
}
