interface CaptureIntegrity {
  screenshot_events?: number;
  screen_recording?: boolean;
  captured_at_ms?: number;
  live_camera_capture?: boolean;
  analysis_issues?: string[];
}

interface CheckInRequest {
  qr_token: string;
  latitude: number;
  longitude: number;
  selfie_path: string;
  client_checked_in_at?: string;
  otp_code?: string;
  capture_integrity?: CaptureIntegrity;
}

interface SelfieAnalysis {
  block: boolean;
  suspected: boolean;
  reasons: string[];
}

const BLOCKING_IMAGE_ISSUES = new Set([
  "png_format",
  "screenshot_metadata",
  "invalid_format",
  "file_too_small",
]);

function analyzeSelfieImage(bytes: Uint8Array): SelfieAnalysis {
  const reasons: string[] = [];

  if (bytes.length < 2048) {
    reasons.push("file_too_small");
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    reasons.push("png_format");
  }

  const isJpeg = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!isJpeg && !reasons.includes("png_format")) {
    reasons.push("invalid_format");
  }

  const scanLen = Math.min(bytes.length, 65536);
  const header = new TextDecoder().decode(bytes.slice(0, scanLen));

  if (/screenshot|screen.?capture|snipping|screen.?shot/i.test(header)) {
    reasons.push("screenshot_metadata");
  }

  if (isJpeg && !header.includes("Exif")) {
    reasons.push("missing_exif");
  }

  const screenSizes: [number, number][] = [
    [1080, 2400],
    [1080, 2340],
    [1170, 2532],
    [1284, 2778],
    [1440, 3200],
    [720, 1600],
    [1080, 1920],
    [828, 1792],
  ];

  // JPEG SOF0 marker scan for dimensions (width/height at offset +7/+9 in segment)
  if (isJpeg) {
    for (let i = 0; i < bytes.length - 9; i++) {
      if (bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc2)) {
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        for (const [sw, sh] of screenSizes) {
          if ((w === sw && h === sh) || (w === sh && h === sw)) {
            reasons.push("screen_resolution_match");
            break;
          }
        }
        break;
      }
    }
  }

  const block = reasons.some((r) => BLOCKING_IMAGE_ISSUES.has(r));
  const suspected = reasons.length > 0;

  return { block, suspected, reasons };
}

function validateCaptureIntegrity(
  integrity: CaptureIntegrity | undefined,
): { block: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!integrity) return { block: false, reasons };

  if ((integrity.screenshot_events ?? 0) > 0) {
    reasons.push("client_screenshot_detected");
  }
  if (integrity.screen_recording) {
    reasons.push("client_screen_recording");
  }
  if (integrity.live_camera_capture === false) {
    reasons.push("not_live_camera");
  }

  for (const issue of integrity.analysis_issues ?? []) {
    if (BLOCKING_IMAGE_ISSUES.has(issue) || issue === "screen_resolution_match") {
      reasons.push(`client_${issue}`);
    }
  }

  return { block: reasons.length > 0, reasons };
}
