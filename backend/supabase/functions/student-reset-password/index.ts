import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  student_id: string;
  image_base64: string;
  new_password: string;
}

function normalizeStudentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8 || !digits.startsWith("0")) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

async function ocrStudentId(imageBase64: string): Promise<string | null> {
  const clientId = Deno.env.get("VERYFI_CLIENT_ID");
  const username = Deno.env.get("VERYFI_USERNAME");
  const apiKey = Deno.env.get("VERYFI_API_KEY");

  if (!clientId || !username || !apiKey) return null;

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
        file_data: imageBase64,
        categories: ["IDs"],
      }),
    },
  );

  const veryfiData = await veryfiRes.json();
  if (!veryfiRes.ok) return null;

  const fields = (veryfiData.ocr_text as string) ?? "";
  const customFields = (veryfiData.custom_fields as Record<string, string>) ?? {};
  return normalizeStudentId(customFields.student_id) ??
    normalizeStudentId(fields.match(/0\d{3}[-\s]?\d{4}/)?.[0] ?? null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id, image_base64, new_password } =
      (await req.json()) as ResetRequest;

    if (!student_id || !image_base64 || !new_password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalized = normalizeStudentId(student_id);
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: "Invalid student ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ocrId = await ocrStudentId(image_base64);
    if (ocrId !== normalized) {
      return new Response(
        JSON.stringify({ error: "ID card does not match the student ID entered" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("student_id", normalized)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      student.id,
      { password: new_password },
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
