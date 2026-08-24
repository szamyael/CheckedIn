/**
 * Crop a face region from a student ID photo for use as a profile avatar.
 *
 * Strategy:
 * 1. Prefer browser FaceDetector API when available (Chrome/Edge).
 * 2. Fall back to the left portrait region typical of Philippine student IDs.
 */
export async function cropIdFaceToBase64(
  imageBase64: string,
): Promise<string | null> {
  try {
    const blob = base64ToBlob(imageBase64);
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;

    const FaceDetectorCtor = (
      window as unknown as {
        FaceDetector?: new (opts?: {
          fastMode?: boolean;
          maxDetectedFaces?: number;
        }) => {
          detect: (
            source: ImageBitmap,
          ) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
        };
      }
    ).FaceDetector;

    if (FaceDetectorCtor) {
      try {
        const detector = new FaceDetectorCtor({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        const faces = await detector.detect(bitmap);
        if (faces.length > 0) {
          const box = faces[0].boundingBox;
          const padX = box.width * 0.35;
          const padY = box.height * 0.45;
          sx = Math.max(0, box.x - padX);
          sy = Math.max(0, box.y - padY);
          sw = Math.min(bitmap.width - sx, box.width + padX * 2);
          sh = Math.min(bitmap.height - sy, box.height + padY * 2);
        } else {
          ({ sx, sy, sw, sh } = leftPortraitRegion(bitmap.width, bitmap.height));
        }
      } catch {
        ({ sx, sy, sw, sh } = leftPortraitRegion(bitmap.width, bitmap.height));
      }
    } else {
      ({ sx, sy, sw, sh } = leftPortraitRegion(bitmap.width, bitmap.height));
    }

    // Output a square-ish avatar
    const size = Math.max(sw, sh);
    canvas.width = 320;
    canvas.height = 320;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 320, 320);
    const scale = Math.min(320 / sw, 320 / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(
      bitmap,
      sx,
      sy,
      sw,
      sh,
      (320 - dw) / 2,
      (320 - dh) / 2,
      dw,
      dh,
    );

    bitmap.close();
    const out = canvas.toDataURL("image/jpeg", 0.88);
    return out.replace(/^data:image\/jpeg;base64,/, "");
  } catch {
    return null;
  }
}

function leftPortraitRegion(width: number, height: number) {
  // Typical ID layout: photo on the left third, vertical middle
  const sw = Math.floor(width * 0.36);
  const sh = Math.floor(height * 0.55);
  const sx = Math.floor(width * 0.04);
  const sy = Math.floor(height * 0.2);
  return { sx, sy, sw, sh };
}

function base64ToBlob(base64: string): Blob {
  const pure = base64.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(pure);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}
