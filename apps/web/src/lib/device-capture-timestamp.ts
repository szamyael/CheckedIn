const utcFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export function formatDeviceCaptureTimestamp(
  capturedAt: string,
  deviceUtcOffsetMinutes: number | null,
): string {
  if (
    deviceUtcOffsetMinutes !== null &&
    (!Number.isInteger(deviceUtcOffsetMinutes) ||
      deviceUtcOffsetMinutes < -840 ||
      deviceUtcOffsetMinutes > 840)
  ) {
    throw new Error("Invalid device timezone offset.");
  }
  const capturedDate = new Date(capturedAt);
  if (Number.isNaN(capturedDate.getTime())) {
    throw new Error("Invalid device capture timestamp.");
  }

  const offsetLabel = deviceUtcOffsetMinutes === null
    ? "UTC; device timezone unavailable"
    : `UTC${deviceUtcOffsetMinutes < 0 ? "-" : "+"}${String(Math.floor(Math.abs(deviceUtcOffsetMinutes) / 60)).padStart(2, "0")}:${String(Math.abs(deviceUtcOffsetMinutes) % 60).padStart(2, "0")}`;
  const offsetMs = (deviceUtcOffsetMinutes ?? 0) * 60_000;
  const deviceTime = utcFormatter.format(new Date(capturedDate.getTime() + offsetMs));
  return `${deviceTime} (${offsetLabel})`;
}
