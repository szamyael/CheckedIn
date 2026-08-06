/** Must match mobile `AppConstants` and edge function expectations. */
export const QR_EVENT_TYPE = "checkedin_event" as const;

export const STUDENT_ID_PATTERN = /^0\d{3}-\d{4}$/;
export const STUDENT_EMAIL_DOMAIN = "@student.checkedin.local";

export function studentAuthEmail(studentId: string): string {
  return `${studentId.toLowerCase()}${STUDENT_EMAIL_DOMAIN}`;
}

/** Digits-only → `0XXX-XXXX`, or null if invalid. */
export function normalizeStudentId(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8 || !digits.startsWith("0")) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/** Live input formatter: keep digits, insert hyphen after 4th. */
export function formatStudentIdInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_PATTERN.test(id);
}

export function buildEventQrPayload(qrToken: string): string {
  return JSON.stringify({ type: QR_EVENT_TYPE, qr_token: qrToken });
}

export function parseEventQrPayload(raw: string): string | null {
  try {
    const data = JSON.parse(raw) as { type?: string; qr_token?: string };
    if (data.type === QR_EVENT_TYPE && data.qr_token) return data.qr_token;
  } catch {
    /* raw uuid fallback */
  }
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      raw.trim(),
    )
  ) {
    return raw.trim();
  }
  return null;
}
