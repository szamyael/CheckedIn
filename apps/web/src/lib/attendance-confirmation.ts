export type AttendanceAction = "check_in" | "break_out" | "break_in" | "check_out";

export interface AttendanceTimestamps {
  checked_in_at: string | null;
  break_out_at: string | null;
  break_in_at: string | null;
  checked_out_at: string | null;
}

export function getAttendanceAction(
  eventType: string,
  previous: AttendanceTimestamps | null,
  current: AttendanceTimestamps,
): AttendanceAction | null {
  if (eventType === "INSERT") {
    return current.checked_in_at ? "check_in" : null;
  }
  if (eventType !== "UPDATE" || !previous) return null;

  if (!previous.break_out_at && current.break_out_at) return "break_out";
  if (!previous.break_in_at && current.break_in_at) return "break_in";
  if (!previous.checked_out_at && current.checked_out_at) return "check_out";
  return null;
}
