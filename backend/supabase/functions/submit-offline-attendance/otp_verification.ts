export interface OtpCodeWindow {
  code: string;
  created_at: string;
  expires_at: string;
}

export function isOtpValidAtCapture(
  otpCodes: OtpCodeWindow[],
  submittedCode: string,
  capturedAt: string,
): boolean {
  const code = submittedCode.trim();
  const captureTime = Date.parse(capturedAt);
  if (!code || Number.isNaN(captureTime)) return false;

  return otpCodes.some((otp) => {
    const createdAt = Date.parse(otp.created_at);
    const expiresAt = Date.parse(otp.expires_at);
    return otp.code === code && createdAt <= captureTime && captureTime < expiresAt;
  });
}
