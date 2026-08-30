import {
  collectTextRegions,
  emptyName,
  extractNameBeforeProgramBlob,
  extractNamesFromLineList,
  extractNamesFromOcr,
  extractNamesFromSpatialLayout,
  hasCompleteName,
  mergeNames,
  parseIdNameLine,
  type ParsedName,
  type TextRegion,
} from "./name_extract.ts";
import { ocrSpaceExtractName } from "./ocr_space.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VeryfiRequest {
  image_base64: string;
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

function isProgramLine(line: string): boolean {
  return /(?:program|course|major|degree|strand)\s*[:\-]/i.test(line) ||
    /\bB\.?\s*S\.?\s+[A-Za-z]/i.test(line) ||
    /\b(BSIT|BSIS|BSCS|BSEd|BEED|AB|MMA)\b/i.test(line) ||
    /\b(information technology|computer science|accountancy|hospitality|tourism|criminology|psychology|engineering|education|business administration)\b/i.test(
      line,
    );
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

  const lines = ocrText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const programLine = lines.find((l) => isProgramLine(l));
  if (programLine) return normalizeProgram(programLine);

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

function looksLikeNameLine(line: string): boolean {
  const parsed = parseIdNameLine(line);
  return Boolean(parsed.first_name && parsed.last_name);
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

function extractFromVeryfi(data: Record<string, unknown>): ParsedIdCard {
  const fields = (data.ocr_text as string) ?? "";
  const customFields = (data.custom_fields as Record<string, string>) ?? {};

  const studentId =
    normalizeStudentId(customFields.student_id) ??
    normalizeStudentId(fields.match(/0\d{3}[-\s]?\d{4}/)?.[0] ?? null);

  const program = extractProgram(fields, customFields);

  const regions: TextRegion[] = [];
  collectTextRegions(data, regions);

  const structuredLines = extractOrderedLinesFromVeryfi(data);
  const fromStructured = structuredLines
    ? extractNamesFromLineList(structuredLines)
    : emptyName();
  const fromSpatial = extractNamesFromSpatialLayout(regions);
  const fromBlob = extractNameBeforeProgramBlob(fields);
  const fromText = extractNamesFromOcr(fields);

  const vendorRaw =
    (data.vendor as { name?: string } | undefined)?.name ??
    (data.bill_to as { name?: string } | undefined)?.name ??
    (typeof data.name === "string" ? data.name : null);
  const fromVendor =
    vendorRaw && looksLikeNameLine(vendorRaw)
      ? parseIdNameLine(vendorRaw)
      : emptyName();

  const mergedName = mergeNames(
    {
      first_name: customFields.first_name ?? customFields.given_name ?? null,
      middle_name: customFields.middle_name ?? null,
      last_name: customFields.last_name ??
        customFields.surname ??
        customFields.family_name ??
        null,
      name_extension: customFields.name_extension ??
        customFields.suffix ??
        customFields.extension ??
        null,
    },
    fromStructured,
    fromSpatial,
    fromBlob,
    fromText,
    fromVendor,
  );

  return {
    student_id: studentId,
    first_name: mergedName.first_name,
    middle_name: mergedName.middle_name,
    last_name: mergedName.last_name,
    name_extension: mergedName.name_extension,
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

    let parsed = extractFromVeryfi(veryfiData);

    if (!hasCompleteName(parsed)) {
      const fallback = await ocrSpaceExtractName(image_base64);
      if (fallback) {
        parsed = {
          ...parsed,
          first_name: firstNonEmpty(
            parsed.first_name,
            fallback.name.first_name,
          ),
          middle_name: firstNonEmpty(
            parsed.middle_name,
            fallback.name.middle_name,
          ),
          last_name: firstNonEmpty(parsed.last_name, fallback.name.last_name),
          name_extension: firstNonEmpty(
            parsed.name_extension,
            fallback.name.name_extension,
          ),
          program: parsed.program ??
            extractProgram(fallback.ocrText, {}),
        };
      }
    }

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
