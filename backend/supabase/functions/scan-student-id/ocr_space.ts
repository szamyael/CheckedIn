import {
  collectTextRegions,
  extractNamesFromLineList,
  extractNamesFromOcr,
  type ParsedName,
  type TextRegion,
} from "./name_extract.ts";

interface OcrSpaceLine {
  LineText?: string;
  Words?: Array<{
    WordText?: string;
    Left?: number;
    Top?: number;
    Width?: number;
    Height?: number;
  }>;
}

interface OcrSpaceResponse {
  ParsedResults?: Array<{
    ParsedText?: string;
    TextOverlay?: { Lines?: OcrSpaceLine[] };
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
}

/** Secondary OCR when Veryfi misses the student name. */
export async function ocrSpaceExtractName(
  imageBase64: string,
): Promise<{ name: ParsedName; ocrText: string } | null> {
  const apiKey = Deno.env.get("OCR_SPACE_API_KEY") ?? "helloworld";
  const pure = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const body = new URLSearchParams({
    apikey: apiKey,
    base64Image: `data:image/jpeg;base64,${pure}`,
    language: "eng",
    isOverlayRequired: "true",
    OCREngine: "2",
    detectOrientation: "true",
    scale: "true",
  });

  try {
    const res = await fetch("https://api.ocr.space/parse", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as OcrSpaceResponse;
    if (!res.ok || data.IsErroredOnProcessing) return null;

    const parsed = data.ParsedResults?.[0];
    if (!parsed) return null;

    const ocrText = parsed.ParsedText ?? "";
    const regions: TextRegion[] = [];

    for (const line of parsed.TextOverlay?.Lines ?? []) {
      if (line.LineText?.trim()) {
        const words = line.Words ?? [];
        if (words.length) {
          const left = Math.min(...words.map((w) => w.Left ?? 0));
          const top = Math.min(...words.map((w) => w.Top ?? 0));
          const right = Math.max(
            ...words.map((w) => (w.Left ?? 0) + (w.Width ?? 0)),
          );
          const bottom = Math.max(
            ...words.map((w) => (w.Top ?? 0) + (w.Height ?? 0)),
          );
          regions.push({
            text: line.LineText.trim(),
            x: left,
            y: top,
            w: right - left,
            h: bottom - top,
          });
        }
      }
      for (const word of line.Words ?? []) {
        if (!word.WordText?.trim()) continue;
        regions.push({
          text: word.WordText.trim(),
          x: word.Left ?? 0,
          y: word.Top ?? 0,
          w: word.Width ?? 0,
          h: word.Height ?? 0,
        });
      }
    }

    const fromLines = extractNamesFromLineList(
      (parsed.TextOverlay?.Lines ?? [])
        .map((l) => l.LineText?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean),
    );

    const fromSpatial = extractNamesFromSpatialLayout(regions);
    const fromText = extractNamesFromOcr(ocrText);

    const name = mergeNameCandidates(fromLines, fromSpatial, fromText);
    if (!name.first_name || !name.last_name) return null;

    return { name, ocrText };
  } catch {
    return null;
  }
}

function mergeNameCandidates(...candidates: ParsedName[]): ParsedName {
  const result: ParsedName = {
    first_name: null,
    middle_name: null,
    last_name: null,
    name_extension: null,
  };
  for (const c of candidates) {
    if (!result.first_name && c.first_name) result.first_name = c.first_name;
    if (!result.middle_name && c.middle_name) {
      result.middle_name = c.middle_name;
    }
    if (!result.last_name && c.last_name) result.last_name = c.last_name;
    if (!result.name_extension && c.name_extension) {
      result.name_extension = c.name_extension;
    }
  }
  return result;
}

function extractNamesFromSpatialLayout(regions: TextRegion[]): ParsedName {
  if (!regions.length) {
    return {
      first_name: null,
      middle_name: null,
      last_name: null,
      name_extension: null,
    };
  }

  const maxX = Math.max(...regions.map((r) => r.x + r.w));
  const rightSide = regions.filter((r) => r.x + r.w / 2 > maxX * 0.32);
  const sorted = [...(rightSide.length >= 3 ? rightSide : regions)].sort(
    (a, b) => a.y - b.y || a.x - b.x,
  );

  const lines: string[] = [];
  let bucket: TextRegion[] = [];
  let bucketY = -1;
  for (const region of sorted) {
    const cy = region.y + region.h / 2;
    if (bucketY < 0 || Math.abs(bucketY - cy) <= 14) {
      bucket.push(region);
      bucketY = bucketY < 0 ? cy : (bucketY + cy) / 2;
    } else {
      lines.push(
        bucket
          .sort((a, b) => a.x - b.x)
          .map((p) => p.text)
          .join(" "),
      );
      bucket = [region];
      bucketY = cy;
    }
  }
  if (bucket.length) {
    lines.push(
      bucket
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" "),
    );
  }

  return extractNamesFromLineList(lines);
}
