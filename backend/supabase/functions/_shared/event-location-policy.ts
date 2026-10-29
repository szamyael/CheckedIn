export function requiresEventLocation(event: {
  requires_location?: unknown;
  venue_name?: unknown;
}): boolean {
  const venueName = typeof event.venue_name === "string"
    ? event.venue_name.trim()
    : "";
  if (
    /\b(?:online|virtual|zoom|webex|skype|discord|teams)\b|google\s*meet|(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|webex\.com)/i.test(
      venueName,
    )
  ) {
    return false;
  }
  return event.requires_location !== false;
}
