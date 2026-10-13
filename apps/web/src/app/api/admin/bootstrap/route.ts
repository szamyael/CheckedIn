import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  isBootstrapSecretConfigured,
  isBootstrapSecretValid,
} from "@/lib/admin/bootstrap-secret";

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Server misconfigured: missing service role key");
  }

  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );
}

export async function GET() {
  try {
    const admin = getAdmin();
    const { count, error } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const needsBootstrap = count === 0;
    const bootstrapConfigured = isBootstrapSecretConfigured(
      process.env.INITIAL_ADMIN_BOOTSTRAP_SECRET,
    );

    return NextResponse.json({
      needsBootstrap: needsBootstrap && bootstrapConfigured,
      bootstrapSetupRequired: needsBootstrap && !bootstrapConfigured,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      bootstrap_secret: bootstrapSecret,
    } = body as Record<string, unknown>;

    if (
      !isBootstrapSecretValid(
        process.env.INITIAL_ADMIN_BOOTSTRAP_SECRET,
        bootstrapSecret,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid or unavailable bootstrap secret" },
        { status: 403 },
      );
    }

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return NextResponse.json(
        { error: "Provide an email, an 8-character password, and both names" },
        { status: 400 },
      );
    }

    const admin = getAdmin();
    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Failed to create auth user" },
        { status: 400 },
      );
    }

    const userId = authUser.user.id;
    const { data: claimed, error: claimError } = await admin.rpc(
      "bootstrap_first_admin",
      {
        p_user_id: userId,
        p_email: email.trim(),
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
      },
    );

    if (claimError || claimed !== true) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
      if (cleanupError) {
        console.error(
          "Could not remove provisional auth user after admin bootstrap failure",
          cleanupError.message,
        );
        return NextResponse.json(
          { error: "Bootstrap failed and the provisional account needs cleanup" },
          { status: 500 },
        );
      }

      if (claimError) {
        console.error("Atomic first-admin claim failed", claimError.message);
        return NextResponse.json(
          { error: "Could not complete first-admin setup" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "An admin account already exists" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (err) {
    console.error("First-admin bootstrap request failed", err);
    return NextResponse.json(
      { error: "Could not complete first-admin setup" },
      { status: 500 },
    );
  }
}
