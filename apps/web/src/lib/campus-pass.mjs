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
