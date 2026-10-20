export function requiresEventLocation(event: {
  requires_location?: unknown;
  venue_name?: unknown;
}): boolean {
  const venueName = typeof event.venue_name === "string"
    ? event.venue_name.trim()
    : "";
  if (/\b(?:online|virtual)\b/i.test(venueName)) {
    return false;
  }
  return event.requires_location !== false;
}
