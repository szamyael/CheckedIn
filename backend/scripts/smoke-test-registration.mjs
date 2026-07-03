/**
 * Smoke test: sign up auth user + complete-student-registration edge function.
 * Usage: node backend/scripts/smoke-test-registration.mjs
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
    resolve(__dirname, "../supabase/.env.example"),
    resolve(__dirname, "../../apps/web/.env.local"),
  ];
  for (const p of paths) {
    try {
      const raw = readFileSync(p, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.replace(/\r$/, "").trim();
        const m = trimmed.match(/^([^#=]+)=(.*)$/);
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
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Minimal valid JPEG (1x1)
const TEST_IMAGE_BASE64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AP/B//9k=";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

async function cleanup(admin, userId, studentId) {
  await admin.from("students").delete().eq("id", userId);
  await admin.from("users").delete().eq("id", userId);
  await admin.storage.from("student-ids").remove([`${userId}/id-card.jpg`]);
  await admin.auth.admin.deleteUser(userId);
  ok(`cleaned up test user ${studentId}`);
}

async function main() {
  const suffix = String(Date.now()).slice(-4);
  const studentId = `0999-${suffix}`;
  const email = `smoke.${Date.now()}@checkedin.test`;
  const password = `SmokeTest${suffix}!`;

  console.log(`Testing registration for ${email} / ${studentId}`);

  const anon = createClient(url, anonKey);
  const admin = createClient(url, serviceKey);

  const { data: signUp, error: signUpError } = await anon.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUp.user) {
    fail(`signUp failed: ${signUpError?.message ?? "no user"}`);
  }

  const userId = signUp.user.id;
  ok(`auth signUp created user ${userId}`);

  const { data: fnData, error: fnError } = await anon.functions.invoke(
    "complete-student-registration",
    {
      body: {
        user_id: userId,
        email,
        student_id: studentId,
        first_name: "Smoke",
        middle_name: null,
        last_name: "Test",
        program: "BS Information Technology",
        year_level: 2,
        image_base64: TEST_IMAGE_BASE64,
      },
    },
  );

  if (fnError) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`edge function failed: ${fnError.message}`);
  }

  if (fnData?.error) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`edge function returned error: ${fnData.error}`);
  }

  ok("complete-student-registration returned success");

  const { data: userRow, error: userRowError } = await admin
    .from("users")
    .select("id, role, status, email")
    .eq("id", userId)
    .maybeSingle();

  if (userRowError || !userRow) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`users row missing: ${userRowError?.message ?? "not found"}`);
  }

  if (userRow.role !== "student" || userRow.status !== "pending" || userRow.email !== email) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`users row unexpected: ${JSON.stringify(userRow)}`);
  }

  ok("users row created with role=student, status=pending");

  const { data: studentRow, error: studentRowError } = await admin
    .from("students")
    .select("id, student_id, first_name, last_name, program, year_level, id_card_image_url")
    .eq("id", userId)
    .maybeSingle();

  if (studentRowError || !studentRow) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`students row missing: ${studentRowError?.message ?? "not found"}`);
  }

  if (
    studentRow.student_id !== studentId ||
    studentRow.first_name !== "Smoke" ||
    studentRow.last_name !== "Test" ||
    !studentRow.id_card_image_url
  ) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`students row unexpected: ${JSON.stringify(studentRow)}`);
  }

  ok("students row created with ID card path");

  const { data: storageList, error: storageError } = await admin.storage
    .from("student-ids")
    .list(userId);

  if (storageError || !storageList?.some((f) => f.name === "id-card.jpg")) {
    await cleanup(admin, userId, studentId).catch(() => {});
    fail(`ID card not uploaded: ${storageError?.message ?? "file missing"}`);
  }

  ok("ID card uploaded to storage");

  await cleanup(admin, userId, studentId);

  console.log("\nSmoke test passed: registration flow works end-to-end.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
