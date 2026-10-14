const DEGREE_PREFIXES: Array<[RegExp, string]> = [
  [/^bachelor of science in\s+/i, "bs "],
  [/^bachelor science in\s+/i, "bs "],
  [/^bachelor of science\s+/i, "bs "],
  [/^bachelor science\s+/i, "bs "],
  [/^bachelor of arts in\s+/i, "ba "],
  [/^bachelor arts in\s+/i, "ba "],
  [/^bachelor of arts\s+/i, "ba "],
  [/^bachelor arts\s+/i, "ba "],
  [/^b\.?\s*s\.?\s+in\s+/i, "bs "],
  [/^b\.?\s*a\.?\s+in\s+/i, "ba "],
  [/^b\.?\s*s\.?\s+/i, "bs "],
  [/^b\.?\s*a\.?\s+/i, "ba "],
];

export function programNameKey(value: string | null | undefined): string {
  let normalized = (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of DEGREE_PREFIXES) {
    const next = normalized.replace(pattern, replacement);
    if (next !== normalized) {
      normalized = next;
      break;
    }
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function canonicalProgramName(value: string | null | undefined): string {
  const key = programNameKey(value);
  if (!key) return "";

  const degreeMatch = key.match(/^(bs|ba)\s+(.+)$/);
  if (degreeMatch) {
    return `${degreeMatch[1].toUpperCase()} ${titleCase(degreeMatch[2])}`;
  }

  return titleCase(key);
}
