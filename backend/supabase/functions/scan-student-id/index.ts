const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VeryfiRequest {
  image_base64: string;
}

interface ParsedIdCard {
  student_id: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
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

function isNoiseNameLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    /student\s*id|school|university|college|campus|program|course|year|section|birth|address|nationality|sex|gender|valid|expire|signature|republic|philippines|department|ministry/.test(
      lower,
    ) ||
    /\d{3,}/.test(line) ||
    line.length < 3
  );
}

/**
 * Extract name parts from OCR text. Philippine student IDs commonly use:
 *   LASTNAME, FIRSTNAME MIDDLENAME
 *   Name: FIRSTNAME MIDDLENAME LASTNAME
 *   LASTNAME FIRSTNAME MIDDLENAME (all caps)
 */
function extractNamesFromOcr(ocrText: string): {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
} {
  const text = ocrText.replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // 1) Explicit label: Name / Full Name / Student Name
  for (const line of lines) {
    const labeled = line.match(
      /(?:full\s*name|student\s*name|name)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1] && !isNoiseNameLine(labeled[1])) {
      return splitNameParts(labeled[1]);
    }
  }

  // 2) LASTNAME, FIRSTNAME M.I. / FIRSTNAME MIDDLENAME
  for (const line of lines) {
    if (isNoiseNameLine(line)) continue;
    const comma = line.match(
      /^([A-Za-zÑñ][A-Za-zÑñ'\-\s]{1,40}),\s*([A-Za-zÑñ][A-Za-zÑñ'\-\s]{1,60})$/,
    );
    if (comma) {
      const last = titleCaseName(comma[1].trim());
      const rest = comma[2].trim().split(/\s+/).filter(Boolean);
      if (rest.length >= 1) {
        return {
          last_name: last,
          first_name: titleCaseName(rest[0]),
          middle_name:
            rest.length > 1 ? titleCaseName(rest.slice(1).join(" ")) : null,
        };
      }
    }
  }

  // 3) ALL-CAPS multi-word line that looks like a name (common on IDs)
  const capsCandidates = lines.filter(
    (l) =>
      /^[A-ZÑ][A-ZÑ'\-\s]{4,}$/.test(l) &&
      !isNoiseNameLine(l) &&
      l.split(/\s+/).length >= 2 &&
      l.split(/\s+/).length <= 5,
  );
  if (capsCandidates.length > 0) {
    // Prefer the longest-looking name line near the top half of the card OCR
    const pick =
      capsCandidates.find((l) => l.includes(",")) ?? capsCandidates[0];
    if (pick.includes(",")) {
      const [last, rest] = pick.split(",").map((s) => s.trim());
      const parts = rest.split(/\s+/).filter(Boolean);
      return {
        last_name: titleCaseName(last),
        first_name: parts[0] ? titleCaseName(parts[0]) : null,
        middle_name:
          parts.length > 1 ? titleCaseName(parts.slice(1).join(" ")) : null,
      };
    }
    return splitNameParts(pick);
  }

  // 4) Mixed-case multi-word line without digits
  for (const line of lines) {
    if (isNoiseNameLine(line)) continue;
    if (/^[A-Za-zÑñ][A-Za-zÑñ'\-\s]{4,}$/.test(line)) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && parts.length <= 5) {
        return splitNameParts(line);
      }
    }
  }

  return { first_name: null, middle_name: null, last_name: null };
}

function splitNameParts(raw: string): {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
} {
  const cleaned = raw.replace(/[,]+/g, " ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: null, middle_name: null, last_name: null };
  }
  if (parts.length === 1) {
    return {
      first_name: titleCaseName(parts[0]),
      middle_name: null,
      last_name: null,
    };
  }
  if (parts.length === 2) {
    return {
      first_name: titleCaseName(parts[0]),
      middle_name: null,
      last_name: titleCaseName(parts[1]),
    };
  }
  return {
    first_name: titleCaseName(parts[0]),
    middle_name: titleCaseName(parts.slice(1, -1).join(" ")),
    last_name: titleCaseName(parts[parts.length - 1]),
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
  const fromText = extractNamesFromOcr(fields);

  // Veryfi sometimes puts a full name in vendor / bill_to / name fields
  const vendor =
    (data.vendor as { name?: string } | undefined)?.name ??
    (data.bill_to as { name?: string } | undefined)?.name ??
    (typeof data.name === "string" ? data.name : null);
  const fromVendor = vendor ? splitNameParts(vendor) : null;

  return {
    student_id: studentId,
    first_name: firstNonEmpty(
      customFields.first_name,
      customFields.given_name,
      fromText.first_name,
      fromVendor?.first_name,
    ),
    middle_name: firstNonEmpty(
      customFields.middle_name,
      fromText.middle_name,
      fromVendor?.middle_name,
    ),
    last_name: firstNonEmpty(
      customFields.last_name,
      customFields.surname,
      customFields.family_name,
      fromText.last_name,
      fromVendor?.last_name,
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
