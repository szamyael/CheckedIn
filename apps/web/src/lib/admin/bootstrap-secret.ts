import { timingSafeEqual } from "node:crypto";

const MIN_BOOTSTRAP_SECRET_BYTES = 32;

export function isBootstrapSecretConfigured(secret: string | undefined) {
  return Boolean(
    secret && Buffer.byteLength(secret, "utf8") >= MIN_BOOTSTRAP_SECRET_BYTES,
  );
}

export function isBootstrapSecretValid(
  configured: string | undefined,
  submitted: unknown,
) {
  if (
    typeof configured !== "string" ||
    !isBootstrapSecretConfigured(configured) ||
    typeof submitted !== "string"
  ) {
    return false;
  }

  const expected = Buffer.from(configured, "utf8");
  const actual = Buffer.from(submitted, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
