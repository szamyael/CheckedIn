import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeStudentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8 || !digits.startsWith("0")) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id } = await req.json();

    const normalized = normalizeStudentId(student_id);
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: "Invalid student ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: student, error } = await supabase
      .from("students")
      .select("id, users(email)")
      .eq("student_id", normalized)
      .maybeSingle();

    if (error || !student) {
      return new Response(
        JSON.stringify({ error: "Student account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const users = student.users as { email: string | null } | { email: string | null }[] | null;
    const userRow = Array.isArray(users) ? users[0] : users;
    let email = userRow?.email ?? null;

    if (!email) {
      const { data: authData } = await supabase.auth.admin.getUserById(student.id);
      email = authData?.user?.email ?? null;
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email on file for this student" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
