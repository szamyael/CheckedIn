export interface ParsedName {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  name_extension: string | null;
}

export interface TextRegion {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function emptyName(): ParsedName {
  return {
    first_name: null,
    middle_name: null,
    last_name: null,
    name_extension: null,
  };
}

export function titleCaseName(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (part.includes("-")) {
        return part
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("-");
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function isNameExtension(value: string): boolean {
  return /^(jr\.?|sr\.?|ii|iii|iv|v|vi|vii|viii|ix|x|phd|ph\.?d\.?|md)$/i.test(
    value.trim(),
  );
}

function normalizeExtension(value: string): string {
  const v = value.trim();
  if (/^jr\.?$/i.test(v)) return "Jr.";
  if (/^sr\.?$/i.test(v)) return "Sr.";
  if (/^ph\.?d\.?$/i.test(v)) return "PhD";
  if (/^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(v)) return v.toUpperCase();
  return titleCaseName(v);
}

const ADDRESS_STOPWORDS =
  /\b(province|city|municipality|barangay|brgy\.?|street|st\.|avenue|ave\.|road|rd\.|purok|sitio|zone|district|region|postal|zip|country|philippines|philippine|address|residence|born|birth|birthday|sex|gender|nationality|civil|status|valid|expires?|signature|republic|department|ministry|school|university|college|campus|institute|polytechnic|academy|student\s*id|id\s*no|course|program|year|section|strand)\b/i;

const GEOGRAPHIC_PHRASES =
  /\b(province\s+of|city\s+of|municipality\s+of|town\s+of|barangay\s+of)\b/i;

const PH_PLACE_NAMES =
  /\b(laguna|manila|quezon|cavite|batangas|rizal|bulacan|pampanga|cebu|davao|iloilo|negros|pangasinan|nueva\s+ecija|zamboanga|cagayan|isabela|bataan|tarlac|benguet|baguio|calamba|san\s+pedro|santa\s+rosa|binan|biñan|cabuyao|los\s+baños|makati|pasig|taguig|pasay|paranaque|parañaque|marikina|antipolo|caloocan)\b/i;

function isNoiseNameLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    ADDRESS_STOPWORDS.test(lower) ||
    GEOGRAPHIC_PHRASES.test(lower) ||
    /\d{3,}/.test(line) ||
    line.length < 3 ||
    /^(of|de|del|da|la|las|los|san|santa|sto\.?|sta\.?)$/i.test(line.trim())
  );
}

export function isProgramLine(line: string): boolean {
  if (looksLikePersonNameLine(line)) return false;
  return (
    /(?:program|course|major|degree|strand)\s*[:\-]/i.test(line) ||
    /\bB\.?\s*S\.?\s+[A-Za-z]/i.test(line) ||
    /\b(BSIT|BSIS|BSCS|BSEd|BEED|AB|MMA)\b/i.test(line) ||
    /\b(information technology|computer science|accountancy|hospitality|tourism|criminology|psychology|engineering|education|business administration)\b/i.test(
      line,
    )
  );
}

export function parseMiddleInitialName(raw: string): ParsedName | null {
  const line = raw.replace(/\s+/g, " ").trim();
  const match = line.match(
    /^([A-Za-zÑñ][A-Za-zÑñ' \-]*?)\s+([A-Za-zÑñ](?:\.[A-Za-zÑñ]\.?)?)\s+([A-Za-zÑñ][A-Za-zÑñ' \-]+?)(?:\s+((?:Jr\.?|Sr\.?|II|III|IV|V|VI|VII|VIII|IX|X|PhD|Ph\.?D\.?)))?$/i,
  );
  if (!match) return null;

  let middle = match[2].trim();
  if (!middle.endsWith(".")) middle = `${middle.charAt(0).toUpperCase()}.`;
  else middle = middle.charAt(0).toUpperCase() + middle.slice(1);

  return {
    first_name: titleCaseName(match[1]),
    middle_name: middle,
    last_name: titleCaseName(match[3]),
    name_extension: match[4] ? normalizeExtension(match[4]) : null,
  };
}

function looksLikePersonNameLine(line: string): boolean {
  if (isNoiseNameLine(line)) return false;
  if (parseMiddleInitialName(line)) return true;
  if (GEOGRAPHIC_PHRASES.test(line) || PH_PLACE_NAMES.test(line)) return false;

  const cleaned = line.replace(/[,.]/g, " ").trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 6) return false;
  if (!/^[A-Za-zÑñ][A-Za-zÑñ'\-\s,.]{2,}$/.test(line)) return false;

  const stopCount = tokens.filter((t) =>
    /^(of|the|de|del|da|la|las|los|province|city|municipality|barangay)$/i.test(
      t,
    )
  ).length;
  if (stopCount >= 1 && tokens.length <= 3) return false;
  return true;
}

function looksLikeNameLine(line: string): boolean {
  if (isProgramLine(line) || isNoiseNameLine(line)) return false;
  return looksLikePersonNameLine(line);
}

export function parseIdNameLine(raw: string): ParsedName {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  const middleInitial = parseMiddleInitialName(trimmed);
  if (middleInitial) return middleInitial;

  const commaParts = trimmed
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (commaParts.length >= 4) {
    return {
      first_name: titleCaseName(commaParts[0]),
      middle_name: titleCaseName(commaParts[1]),
      last_name: titleCaseName(commaParts[2]),
      name_extension: normalizeExtension(commaParts.slice(3).join(" ")),
    };
  }

  if (commaParts.length === 3) {
    if (isNameExtension(commaParts[2])) {
      return {
        first_name: titleCaseName(commaParts[0]),
        middle_name: null,
        last_name: titleCaseName(commaParts[1]),
        name_extension: normalizeExtension(commaParts[2]),
      };
    }
    return {
      first_name: titleCaseName(commaParts[0]),
      middle_name: titleCaseName(commaParts[1]),
      last_name: titleCaseName(commaParts[2]),
      name_extension: null,
    };
  }

  if (commaParts.length === 2) {
    return {
      first_name: titleCaseName(commaParts[0]),
      middle_name: null,
      last_name: titleCaseName(commaParts[1]),
      name_extension: null,
    };
  }

  const tokens = trimmed.replace(/[,]+/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return emptyName();

  let extension: string | null = null;
  if (tokens.length >= 3 && isNameExtension(tokens[tokens.length - 1])) {
    extension = normalizeExtension(tokens.pop()!);
  }

  if (tokens.length === 1) {
    return {
      first_name: titleCaseName(tokens[0]),
      middle_name: null,
      last_name: null,
      name_extension: extension,
    };
  }
  if (tokens.length === 2) {
    return {
      first_name: titleCaseName(tokens[0]),
      middle_name: null,
      last_name: titleCaseName(tokens[1]),
      name_extension: extension,
    };
  }
  return {
    first_name: titleCaseName(tokens[0]),
    middle_name: titleCaseName(tokens.slice(1, -1).join(" ")),
    last_name: titleCaseName(tokens[tokens.length - 1]),
    name_extension: extension,
  };
}

function scoreNameCandidate(line: string, distanceFromProgram: number): number {
  let score = 0;
  if (!looksLikeNameLine(line)) return -100;
  if (distanceFromProgram === 1) score += 20;
  score += Math.max(0, 14 - distanceFromProgram * 5);
  if (parseMiddleInitialName(line)) score += 15;
  if (line.includes(",")) score += 6;
  if (/^[A-ZÑ][A-ZÑ'\-\s,.]{4,}$/.test(line)) score += 5;
  const tokens = line.replace(/[,.]/g, " ").trim().split(/\s+/);
  if (tokens.length === 3) score += 4;
  if (PH_PLACE_NAMES.test(line) || GEOGRAPHIC_PHRASES.test(line)) score -= 50;
  if (ADDRESS_STOPWORDS.test(line)) score -= 40;
  return score;
}

export function extractNamesFromLineList(lines: string[]): ParsedName {
  const programIndex = lines.findIndex((l) => isProgramLine(l));
  if (programIndex > 0) {
    for (let i = programIndex - 1; i >= Math.max(0, programIndex - 3); i--) {
      const parsed = parseIdNameLine(lines[i]);
      if (parsed.first_name && parsed.last_name) return parsed;
    }
  }
  return emptyName();
}

/** Regex: name line immediately before a program/course line in raw OCR blob. */
export function extractNameBeforeProgramBlob(ocrText: string): ParsedName {
  const blob = ocrText.replace(/\r/g, "\n");
  const patterns = [
    /(?:^|\n)\s*([A-Za-zÑñ][A-Za-zÑñ' \-]{1,30}\s+[A-Za-zÑñ]\.?\s+[A-Za-zÑñ][A-Za-zÑñ' \-]{1,30})(?:\s+((?:Jr\.?|Sr\.?|II|III|IV|V)))?\s*\n\s*[^\n]*(?:B\.?\s*S\.?|BSIT|BSIS|Information Technology|Computer Science)/i,
    /(?:name|student\s*name)\s*[:\-]\s*([A-Za-zÑñ][A-Za-zÑñ' \-.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = blob.match(pattern);
    if (match?.[1] && looksLikeNameLine(match[1])) {
      const parsed = parseIdNameLine(match[1]);
      if (parsed.first_name && parsed.last_name) return parsed;
    }
  }
  return emptyName();
}

export function extractNamesFromOcr(ocrText: string): ParsedName {
  const lines = ocrText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    const labeled = line.match(
      /(?:full\s*name|student\s*name|\bname)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1] && looksLikeNameLine(labeled[1])) {
      return parseIdNameLine(labeled[1]);
    }
  }

  const fromBlob = extractNameBeforeProgramBlob(ocrText);
  if (fromBlob.first_name && fromBlob.last_name) return fromBlob;

  const programIndex = lines.findIndex((l) => isProgramLine(l));
  if (programIndex > 0) {
    const immediate = lines[programIndex - 1];
    if (looksLikeNameLine(immediate)) return parseIdNameLine(immediate);

    let best: { line: string; score: number } | null = null;
    const start = Math.max(0, programIndex - 4);
    for (let i = programIndex - 1; i >= start; i--) {
      const distance = programIndex - i;
      const score = scoreNameCandidate(lines[i], distance);
      if (score < 0) continue;
      if (!best || score > best.score) best = { line: lines[i], score };
    }
    if (best) return parseIdNameLine(best.line);
  }

  let bestGlobal: { line: string; score: number } | null = null;
  for (const line of lines) {
    const score = scoreNameCandidate(line, 5);
    if (score < 4) continue;
    if (!bestGlobal || score > bestGlobal.score) {
      bestGlobal = { line, score };
    }
  }
  if (bestGlobal) return parseIdNameLine(bestGlobal.line);

  return emptyName();
}

function readBbox(raw: unknown): [number, number, number, number] | null {
  if (!Array.isArray(raw) || raw.length < 4) return null;
  const nums = raw.map((v) => Number(v));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return [nums[0], nums[1], nums[2], nums[3]];
}

/** Walk the entire Veryfi JSON tree and collect text + bounding boxes. */
export function collectTextRegions(
  obj: unknown,
  regions: TextRegion[],
  depth = 0,
): void {
  if (depth > 14 || obj == null) return;

  if (Array.isArray(obj)) {
    for (const item of obj) collectTextRegions(item, regions, depth + 1);
    return;
  }

  if (typeof obj !== "object") return;
  const record = obj as Record<string, unknown>;

  const text =
    typeof record.text === "string"
      ? record.text.trim()
      : typeof record.value === "string"
        ? record.value.trim()
        : typeof record.line_text === "string"
          ? record.line_text.trim()
          : null;

  const bbox =
    readBbox(record.bbox) ??
    readBbox(record.bounding_box) ??
    readBbox(record.bounding_region);

  if (text && bbox) {
    const [x1, y1, x2, y2] = bbox;
    regions.push({
      text,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
    });
  }

  for (const value of Object.values(record)) {
    collectTextRegions(value, regions, depth + 1);
  }
}

function clusterRegionsIntoLines(
  regions: TextRegion[],
  yThreshold = 14,
): string[] {
  if (!regions.length) return [];

  const sorted = [...regions].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Array<{ y: number; parts: TextRegion[] }> = [];

  for (const region of sorted) {
    const cy = region.y + region.h / 2;
    let bucket = lines.find((line) => Math.abs(line.y - cy) <= yThreshold);
    if (!bucket) {
      bucket = { y: cy, parts: [] };
      lines.push(bucket);
    }
    bucket.parts.push(region);
    bucket.y = (bucket.y * (bucket.parts.length - 1) + cy) / bucket.parts.length;
  }

  return lines
    .sort((a, b) => a.y - b.y)
    .map((line) =>
      line.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** Spatial layout: name sits above program on the right side of the ID. */
export function extractNamesFromSpatialLayout(
  regions: TextRegion[],
): ParsedName {
  if (!regions.length) return emptyName();

  const maxX = Math.max(...regions.map((r) => r.x + r.w));
  const rightSide = regions.filter((r) => r.x + r.w / 2 > maxX * 0.32);
  const lines = clusterRegionsIntoLines(
    rightSide.length >= 3 ? rightSide : regions,
  );

  return extractNamesFromLineList(lines);
}

export function hasCompleteName(name: ParsedName): boolean {
  return Boolean(name.first_name?.trim() && name.last_name?.trim());
}

export function mergeNames(...candidates: ParsedName[]): ParsedName {
  const result = emptyName();
  for (const candidate of candidates) {
    if (!result.first_name && candidate.first_name) {
      result.first_name = candidate.first_name;
    }
    if (!result.middle_name && candidate.middle_name) {
      result.middle_name = candidate.middle_name;
    }
    if (!result.last_name && candidate.last_name) {
      result.last_name = candidate.last_name;
    }
    if (!result.name_extension && candidate.name_extension) {
      result.name_extension = candidate.name_extension;
    }
  }
  return result;
}
