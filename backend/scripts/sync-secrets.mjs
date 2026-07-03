/**
 * Load env from backend/supabase/.env and push Veryfi secrets to hosted Supabase.
 * Usage: node scripts/sync-secrets.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../supabase/.env");

function loadEnv(path) {
  const vars = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

const env = loadEnv(envPath);
const keys = ["VERYFI_CLIENT_ID", "VERYFI_USERNAME", "VERYFI_API_KEY"];
const pairs = keys
  .filter((k) => env[k])
  .map((k) => `${k}=${env[k]}`)
  .join(" ");

if (!pairs) {
  console.error("No Veryfi keys found in", envPath);
  process.exit(1);
}

console.log("Setting Supabase edge function secrets…");
execSync(`supabase secrets set ${pairs}`, {
  cwd: resolve(__dirname, ".."),
  stdio: "inherit",
});
console.log("Done. Redeploy functions: supabase functions deploy scan-student-id student-reset-password");
