import assert from "node:assert/strict";
import test from "node:test";
import { isOtpValidAtCapture } from "./otp_verification.ts";

const capturedAt = "2026-10-14T01:18:52.000Z";

test("accepts the submitted code valid at the QR scan time", () => {
  assert.equal(
    isOtpValidAtCapture(
      [{
        code: "123456",
        created_at: "2026-10-14T01:18:00.000Z",
        expires_at: "2026-10-14T01:19:00.000Z",
      }],
      "123456",
      capturedAt,
    ),
    true,
  );
});

test("rejects a code outside its validity window or different from the submitted code", () => {
  const otp = {
    code: "123456",
    created_at: "2026-10-14T01:18:00.000Z",
    expires_at: "2026-10-14T01:19:00.000Z",
  };
  assert.equal(isOtpValidAtCapture([otp], "654321", capturedAt), false);
  assert.equal(
    isOtpValidAtCapture([{ ...otp, created_at: "2026-10-14T01:19:00.000Z" }], "123456", capturedAt),
    false,
  );
  assert.equal(
    isOtpValidAtCapture([{ ...otp, expires_at: capturedAt }], "123456", capturedAt),
    false,
  );
});
