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

function isProgramLine(line: string): boolean {
  return (
    /(?:program|course|major|degree|strand)\s*[:\-]/i.test(line) ||
    /\bB\.?\s*S\.?\s+[A-Za-z]/i.test(line)
  );
}

function looksLikeNameLine(line: string): boolean {
  if (isProgramLine(line) || isNoiseNameLine(line)) return false;
  const cleaned = line.replace(/[,.]/g, " ").trim();
  return /^[A-Za-zÑñ][A-Za-zÑñ'\-\s,]{2,}$/.test(line) &&
    cleaned.split(/\s+/).length >= 2;
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
  if (programIndex > 0) {
    for (let i = programIndex - 1; i >= 0; i--) {
      if (looksLikeNameLine(lines[i])) {
        return parseIdNameLine(lines[i]);
      }
    }
  }

  for (const line of lines) {
    const labeled = line.match(
      /(?:full\s*name|student\s*name|name)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1] && looksLikeNameLine(labeled[1])) {
      return parseIdNameLine(labeled[1]);
    }
  }

  for (const line of lines) {
    if (looksLikeNameLine(line) && line.includes(",")) {
      return parseIdNameLine(line);
    }
  }

  for (const line of lines) {
    if (looksLikeNameLine(line)) return parseIdNameLine(line);
  }

  return emptyName();
}

function parseIdNameLine(raw: string): ParsedName {
  const commaParts = raw
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
  const fromText = extractNamesFromOcr(fields);

  // Veryfi sometimes puts a full name in vendor / bill_to / name fields
  const vendor =
    (data.vendor as { name?: string } | undefined)?.name ??
    (data.bill_to as { name?: string } | undefined)?.name ??
    (typeof data.name === "string" ? data.name : null);
  const fromVendor = vendor ? parseIdNameLine(vendor) : emptyName();

  return {
    student_id: studentId,
    first_name: firstNonEmpty(
      customFields.first_name,
      customFields.given_name,
      fromText.first_name,
      fromVendor.first_name,
    ),
    middle_name: firstNonEmpty(
      customFields.middle_name,
      fromText.middle_name,
      fromVendor.middle_name,
    ),
    last_name: firstNonEmpty(
      customFields.last_name,
      customFields.surname,
      customFields.family_name,
      fromText.last_name,
      fromVendor.last_name,
    ),
    name_extension: firstNonEmpty(
      customFields.name_extension,
      customFields.suffix,
      customFields.extension,
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
