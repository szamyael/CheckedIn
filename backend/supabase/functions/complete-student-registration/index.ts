import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CompleteRegistrationRequest {
  user_id: string;
  email: string;
  student_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  program: string;
  year_level: number;
  section?: string | null;
  image_base64: string;
}

function normalizeStudentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8 || !digits.startsWith("0")) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function decodeBase64Image(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CompleteRegistrationRequest;
    const {
      user_id,
      email,
      student_id,
      first_name,
      middle_name,
      last_name,
      program,
      year_level,
      section,
      image_base64,
    } = body;

    if (
      !user_id ||
      !email ||
      !student_id ||
      !first_name ||
      !last_name ||
      !program ||
      !year_level ||
      !image_base64
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedId = normalizeStudentId(student_id);
    if (!normalizedId) {
      return new Response(
        JSON.stringify({ error: "Invalid student ID format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (year_level < 1 || year_level > 5) {
      return new Response(
        JSON.stringify({ error: "Year level must be between 1 and 5" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: authUser, error: authUserError } = await supabase.auth.admin
      .getUserById(user_id);

    if (authUserError || !authUser.user) {
      return new Response(
        JSON.stringify({ error: "Auth account not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authEmail = authUser.user.email?.toLowerCase();
    if (authEmail && authEmail !== email.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match auth account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Student profile already exists" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("student_id", normalizedId)
      .maybeSingle();

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: "Student ID is already registered" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const path = `${user_id}/id-card.jpg`;
    const imageBytes = decodeBase64Image(image_base64);

    const { error: uploadError } = await supabase.storage
      .from("student-ids")
      .upload(path, imageBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: userInsertError } = await supabase.from("users").insert({
      id: user_id,
      role: "student",
      status: "pending",
      email: email.trim().toLowerCase(),
    });

    if (userInsertError) {
      await supabase.storage.from("student-ids").remove([path]);
      return new Response(
        JSON.stringify({ error: userInsertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: studentInsertError } = await supabase.from("students").insert({
      id: user_id,
      student_id: normalizedId,
      first_name: first_name.trim(),
      middle_name: middle_name?.trim() || null,
      last_name: last_name.trim(),
      program: program.trim(),
      year_level,
      section: section?.trim() || null,
      id_card_image_url: path,
    });

    if (studentInsertError) {
      await supabase.from("users").delete().eq("id", user_id);
      await supabase.storage.from("student-ids").remove([path]);
      return new Response(
        JSON.stringify({ error: studentInsertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
