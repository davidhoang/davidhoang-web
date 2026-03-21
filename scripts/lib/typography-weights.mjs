/**
 * Daily theme typography: enforce clear hierarchy (headings heavier than body).
 * Uses the standard CSS 100–900 weight scale in steps of 100.
 */

const MIN_STEP = 100;

/**
 * Parse a font-weight from model output ("600", "400", or noisy strings).
 * @param {unknown} value
 * @returns {number | null} 100–900 or null
 */
export function parseFontWeight(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const m = s.match(/\b([1-9]\d{2})\b/);
  const n = m ? parseInt(m[1], 10) : parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  const rounded = Math.round(n / 100) * 100;
  return Math.min(900, Math.max(100, rounded));
}

/**
 * Mutates typography so headingWeight is strictly greater than bodyWeight.
 * Prefers raising heading first; only lowers body if heading is already 900.
 * @param {Record<string, unknown>} typography
 */
export function enforceHeadingHeavierThanBody(typography) {
  if (!typography || typeof typography !== 'object') return;

  let heading = parseFontWeight(typography.headingWeight) ?? 600;
  let body = parseFontWeight(typography.bodyWeight) ?? 400;

  if (heading <= body) {
    heading = Math.min(900, body + MIN_STEP);
    if (heading <= body) {
      body = Math.max(100, heading - MIN_STEP);
    }
  }

  typography.headingWeight = String(heading);
  typography.bodyWeight = String(body);
}
