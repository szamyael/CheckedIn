/**
 * @param {string} value
 * @returns {string | null}
 */
export function normalizeCampusPassToken(value) {
  const token = value.trim();
  return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(token)
    ? token.toLowerCase()
    : null;
}

/**
 * @param {unknown[]} values
 * @param {Set<string>} seenTokens
 * @returns {string[]}
 */
export function getNewCampusPassTokens(values, seenTokens) {
  if (values.length === 0) {
    seenTokens.clear();
    return [];
  }

  return [...new Set(values
    .filter((value) => typeof value === "string")
    .map(normalizeCampusPassToken)
    .filter((token) => token !== null))]
    .filter((token) => {
      if (seenTokens.has(token)) return false;
      seenTokens.add(token);
      return true;
    });
}

/**
 * @param {unknown} value
 * @returns {{ success: true, action: "checked_in" | "checked_out", student: { name: string, student_id: string, program: string, year_level: number | null, section: string | null } } | { success: false, error: string } | null}
 */
export function parseCampusPassScanResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = /** @type {Record<string, unknown>} */ (value);
  if (result.success === false && typeof result.error === "string") {
    return { success: false, error: result.error };
  }
  const action = result.action === undefined ? "checked_in" : result.action;
  if (
    result.success !== true ||
    (action !== "checked_in" && action !== "checked_out") ||
    !result.student ||
    typeof result.student !== "object"
  ) {
    return null;
  }

  const student = /** @type {Record<string, unknown>} */ (result.student);
  if (
    typeof student.name !== "string" ||
    typeof student.student_id !== "string" ||
    typeof student.program !== "string" ||
    (student.year_level !== null && typeof student.year_level !== "number") ||
    (student.section !== null && typeof student.section !== "string")
  ) {
    return null;
  }

  return {
    success: true,
    action,
    student: {
      name: student.name,
      student_id: student.student_id,
      program: student.program,
      year_level: student.year_level,
      section: student.section,
    },
  };
}
