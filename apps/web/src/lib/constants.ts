/** Must match mobile `AppConstants` and edge function expectations. */
export const QR_EVENT_TYPE = "checkedin_event" as const;

export const STUDENT_ID_PATTERN = /^0\d{3}-\d{4}$/;
export const STUDENT_EMAIL_DOMAIN = "@student.checkedin.local";

export function studentAuthEmail(studentId: string): string {
  return `${studentId.toLowerCase()}${STUDENT_EMAIL_DOMAIN}`;
}

export function buildEventQrPayload(qrToken: string): string {
  return JSON.stringify({ type: QR_EVENT_TYPE, qr_token: qrToken });
}
