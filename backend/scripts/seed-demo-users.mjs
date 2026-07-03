/**
 * Seed demo staff accounts for local/dev use.
 * Usage: node scripts/seed-demo-users.mjs
 */
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "../../apps/web/package.json"));
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const paths = [
    resolve(__dirname, "../supabase/.env"),
    resolve(__dirname, "../../apps/web/.env.local"),
  ];
  for (const p of paths) {
    try {
      const raw = readFileSync(p, "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    } catch {
      /* try next */
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function upsertStaff({
  email,
  password,
  role,
  first_name,
  last_name,
  department = null,
  organization_id = null,
}) {
  let userId;
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`${email}: ${error.message}`);
    userId = existing.id;
    console.log(`Updated auth user: ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`${email}: ${error?.message ?? "create failed"}`);
    }
    userId = data.user.id;
    console.log(`Created auth user: ${email}`);
  }

  const { error: userError } = await admin.from("users").upsert(
    { id: userId, role, status: "active", email },
    { onConflict: "id" },
  );
  if (userError) throw new Error(`${email} users: ${userError.message}`);

  const { error: staffError } = await admin.from("staff_profiles").upsert(
    {
      id: userId,
      first_name,
      last_name,
      department,
      organization_id,
    },
    { onConflict: "id" },
  );
  if (staffError) throw new Error(`${email} staff: ${staffError.message}`);

  console.log(`Seeded ${role}: ${email}`);
  return userId;
}

async function ensureOrganization(name, createdBy) {
  const { data: existing } = await admin
    .from("organizations")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await admin
    .from("organizations")
    .insert({ name, description: "Demo organization", created_by: createdBy })
    .select("id")
    .single();

  if (error) throw new Error(`organization: ${error.message}`);
  console.log(`Created organization: ${name}`);
  return data.id;
}

async function main() {
  const adminId = await upsertStaff({
    email: "admin@checkedin.com",
    password: "admin123",
    role: "admin",
    first_name: "System",
    last_name: "Admin",
  });

  await upsertStaff({
    email: "faculty@checkedin.com",
    password: "faculty123",
    role: "faculty",
    first_name: "Demo",
    last_name: "Faculty",
    department: "Computer Science",
  });

  const orgId = await ensureOrganization("CheckedIn Student Org", adminId);

  await upsertStaff({
    email: "org@checkedin.com",
    password: "org123",
    role: "org_member",
    first_name: "Demo",
    last_name: "Organization",
    organization_id: orgId,
  });

  console.log("\nDemo accounts ready:");
  console.log("  admin@checkedin.com / admin123");
  console.log("  faculty@checkedin.com / faculty123");
  console.log("  org@checkedin.com / org123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
