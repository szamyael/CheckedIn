export function formatStudentDisplayName(parts: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  name_extension?: string | null;
}): string {
  return [
    parts.first_name,
    parts.middle_name,
    parts.last_name,
    parts.name_extension,
  ]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(", ");
}
