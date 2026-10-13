export function isOfflineCheckInAttempt(body: {
  client_checked_in_at?: unknown;
}) {
  return Object.hasOwn(body, "client_checked_in_at");
}
