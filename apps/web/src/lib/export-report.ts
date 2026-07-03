export interface ExportRow {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year_level: number | null;
  checked_in_at: string;
  distance_from_venue_m: number | null;
  event_title?: string;
}

export const EXPORT_HEADERS = [
  "Student ID",
  "First Name",
  "Last Name",
  "Program",
  "Year Level",
  "Checked In",
  "Distance (m)",
] as const;

export function getExportHeaders(includeEvent: boolean): string[] {
  return includeEvent ? ["Event", ...EXPORT_HEADERS] : [...EXPORT_HEADERS];
}

export function exportRowsToMatrix(
  rows: ExportRow[],
  includeEvent = false,
): string[][] {
  return rows.map((r) => [
    ...(includeEvent ? [r.event_title ?? ""] : []),
    r.student_id,
    r.first_name,
    r.last_name,
    r.program,
    r.year_level != null ? String(r.year_level) : "",
    r.checked_in_at,
    r.distance_from_venue_m?.toFixed(1) ?? "",
  ]);
}
