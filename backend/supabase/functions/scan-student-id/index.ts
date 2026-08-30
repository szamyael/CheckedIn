const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VeryfiRequest {
  image_base64: string;
}

interface ParsedName {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  name_extension: string | null;
}

interface ParsedIdCard extends ParsedName {
  student_id: string | null;
  program: string | null;
  raw: Record<string, unknown>;
}

function normalizeStudentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8 || !digits.startsWith("0")) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function normalizeProgram(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\s*B\.?\s*S\.?\s*/i, "BS ")
    .trim();
}

function titleCaseName(value: string): string {
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

function emptyName(): ParsedName {
  return {
    first_name: null,
    middle_name: null,
    last_name: null,
    name_extension: null,
  };
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
    // Tiny connector words alone (Of, De, Del) are never a full name line
    /^(of|de|del|da|la|las|los|san|santa|sto\.?|sta\.?)$/i.test(line.trim())
  );
}

function isProgramLine(line: string): boolean {
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

/** Person name line (not program/address). Supports "Juan T. Tamad". */
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

/** Higher score = more likely the ID name line directly above the program/course. */
function scoreNameCandidate(line: string, distanceFromProgram: number): number {
  let score = 0;
  if (!looksLikeNameLine(line)) return -100;

  // Strongest signal: line immediately above the yellow program/course row
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

/**
 * Typical ID layout: name on the line above the yellow course/program.
 * Format: First name, Middle initial, Last name — e.g. "Juan T. Tamad"
 */
function parseMiddleInitialName(raw: string): ParsedName | null {
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

function extractOrderedLinesFromVeryfi(
  data: Record<string, unknown>,
): string[] | null {
  const meta = data.meta as
    | { pages?: Array<{ lines?: Array<{ text?: string; bbox?: number[] }> }> }
    | undefined;
  const pages = meta?.pages;
  if (!pages?.length) return null;

  const rows: Array<{ text: string; y: number }> = [];
  for (const page of pages) {
    for (const line of page.lines ?? []) {
      const text = line.text?.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const bbox = line.bbox ?? [];
      const y = typeof bbox[1] === "number" ? bbox[1] : rows.length;
      rows.push({ text, y });
    }
  }
  if (!rows.length) return null;
  rows.sort((a, b) => a.y - b.y);
  return rows.map((r) => r.text);
}

function extractNamesFromLineList(lines: string[]): ParsedName {
  const programIndex = lines.findIndex((l) => isProgramLine(l));
  if (programIndex > 0) {
    for (let i = programIndex - 1; i >= Math.max(0, programIndex - 2); i--) {
      const candidate = lines[i];
      const parsed = parseIdNameLine(candidate);
      if (parsed.first_name && parsed.last_name) return parsed;
    }
  }
  return emptyName();
}

/**
 * ID name sits directly above course/program:
 * Firstname, Middle Name, Last Name, Name Extensions
 */
function extractNamesFromOcr(ocrText: string): ParsedName {
  const lines = ocrText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const programIndex = lines.findIndex((l) => isProgramLine(l));

  // 1) Prefer labeled name fields
  for (const line of lines) {
    const labeled = line.match(
      /(?:full\s*name|student\s*name|\bname)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1] && looksLikeNameLine(labeled[1])) {
      return parseIdNameLine(labeled[1]);
    }
  }

  // 2) Strong preference: line immediately above the program/course (yellow row)
  if (programIndex > 0) {
    const immediate = lines[programIndex - 1];
    if (looksLikeNameLine(immediate)) {
      return parseIdNameLine(immediate);
    }

    let best: { line: string; score: number } | null = null;
    const start = Math.max(0, programIndex - 3);
    for (let i = programIndex - 1; i >= start; i--) {
      const distance = programIndex - i;
      const score = scoreNameCandidate(lines[i], distance);
      if (score < 0) continue;
      if (!best || score > best.score) {
        best = { line: lines[i], score };
      }
    }
    if (best) return parseIdNameLine(best.line);
  }

  // 3) Fallback: best scored name-like line anywhere (still reject address noise)
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

function parseIdNameLine(raw: string): ParsedName {
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

  const tokens = raw.replace(/[,]+/g, " ").split(/\s+/).filter(Boolean);
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

function extractProgram(
  ocrText: string,
  customFields: Record<string, string>,
): string | null {
  const fromCustom =
    customFields.program ??
    customFields.course ??
    customFields.major ??
    customFields.degree ??
    customFields.programme;
  if (fromCustom?.trim()) return normalizeProgram(fromCustom);

  const knownPrograms = [
    "Information Technology",
    "Computer Science",
    "Computer Engineering",
    "Information Systems",
    "Data Science",
    "Software Engineering",
    "Business Administration",
  ];

  for (const name of knownPrograms) {
    const pattern = new RegExp(
      `\\bB\\.?\\s*S\\.?\\s*${name.replace(/ /g, "\\s+")}\\b`,
      "i",
    );
    const match = ocrText.match(pattern);
    if (match) return normalizeProgram(match[0]);
  }

  const labelMatch = ocrText.match(
    /(?:program|course|major|degree|strand)\s*[:\-]?\s*(B\.?\s*S\.?\s*[A-Za-z][A-Za-z\s\-&]{2,60})/i,
  );
  if (labelMatch?.[1]) return normalizeProgram(labelMatch[1]);

  const bsLineMatch = ocrText.match(
    /\b(B\.?\s*S\.?\s+(?:Information Technology|Computer Science|[A-Za-z][A-Za-z\s\-&]{3,50}))\b/i,
  );
  if (bsLineMatch?.[1]) return normalizeProgram(bsLineMatch[1]);

  return null;
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function extractFromVeryfi(data: Record<string, unknown>): ParsedIdCard {
  const fields = (data.ocr_text as string) ?? "";
  const customFields = (data.custom_fields as Record<string, string>) ?? {};

  const studentId =
    normalizeStudentId(customFields.student_id) ??
    normalizeStudentId(fields.match(/0\d{3}[-\s]?\d{4}/)?.[0] ?? null);

  const program = extractProgram(fields, customFields);
  const structuredLines = extractOrderedLinesFromVeryfi(data);
  const fromStructured = structuredLines
    ? extractNamesFromLineList(structuredLines)
    : emptyName();
  const fromText = extractNamesFromOcr(fields);

  // Veryfi sometimes puts a full name in vendor / bill_to / name fields —
  // ignore those when they look like address / school noise.
  const vendorRaw =
    (data.vendor as { name?: string } | undefined)?.name ??
    (data.bill_to as { name?: string } | undefined)?.name ??
    (typeof data.name === "string" ? data.name : null);
  const fromVendor =
    vendorRaw && looksLikeNameLine(vendorRaw)
      ? parseIdNameLine(vendorRaw)
      : emptyName();

  // Prefer structured lines, then OCR text (name above program), then vendor
  return {
    student_id: studentId,
    first_name: firstNonEmpty(
      customFields.first_name,
      customFields.given_name,
      fromStructured.first_name,
      fromText.first_name,
      fromVendor.first_name,
    ),
    middle_name: firstNonEmpty(
      customFields.middle_name,
      fromStructured.middle_name,
      fromText.middle_name,
      fromVendor.middle_name,
    ),
    last_name: firstNonEmpty(
      customFields.last_name,
      customFields.surname,
      customFields.family_name,
      fromStructured.last_name,
      fromText.last_name,
      fromVendor.last_name,
    ),
    name_extension: firstNonEmpty(
      customFields.name_extension,
      customFields.suffix,
      customFields.extension,
      fromStructured.name_extension,
      fromText.name_extension,
      fromVendor.name_extension,
    ),
    program,
    raw: data,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_base64 } = (await req.json()) as VeryfiRequest;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const clientId = Deno.env.get("VERYFI_CLIENT_ID");
    const username = Deno.env.get("VERYFI_USERNAME");
    const apiKey = Deno.env.get("VERYFI_API_KEY");

    if (!clientId || !username || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Veryfi credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const veryfiRes = await fetch(
      "https://api.veryfi.com/api/v8/partner/documents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CLIENT-ID": clientId,
          Authorization: `apikey ${username}:${apiKey}`,
        },
        body: JSON.stringify({
          file_data: image_base64,
          categories: ["IDs"],
        }),
      },
    );

    const veryfiData = await veryfiRes.json();

    if (!veryfiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Veryfi OCR failed", details: veryfiData }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const parsed = extractFromVeryfi(veryfiData);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
