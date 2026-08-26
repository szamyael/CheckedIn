/** Resize/compress an image file or base64 so registration uploads stay small. */
export async function compressImageToJpegBase64(
  input: File | string,
  options?: { maxSide?: number; quality?: number },
): Promise<string> {
  const maxSide = options?.maxSide ?? 1280;
  const quality = options?.quality ?? 0.78;

  const bitmap =
    typeof input === "string"
      ? await createImageBitmap(base64ToBlob(input))
      : await createImageBitmap(input);

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
}

function base64ToBlob(base64: string): Blob {
  const pure = base64.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(pure);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}
