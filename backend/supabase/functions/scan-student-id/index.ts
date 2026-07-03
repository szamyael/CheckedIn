import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function extractFromVeryfi(data: Record<string, unknown>): ParsedIdCard {
  const fields = (data.ocr_text as string) ?? "";
  const customFields = (data.custom_fields as Record<string, string>) ?? {};

  const studentId =
    normalizeStudentId(customFields.student_id) ??
    normalizeStudentId(
      fields.match(/0\d{3}[-\s]?\d{4}/)?.[0] ?? null,
    );

  const program = extractProgram(fields, customFields);

  return {
    student_id: studentId,
    first_name: customFields.first_name ?? null,
    middle_name: customFields.middle_name ?? null,
    last_name: customFields.last_name ?? null,
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientId = Deno.env.get("VERYFI_CLIENT_ID");
    const username = Deno.env.get("VERYFI_USERNAME");
    const apiKey = Deno.env.get("VERYFI_API_KEY");

    if (!clientId || !username || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Veryfi credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = extractFromVeryfi(veryfiData);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
