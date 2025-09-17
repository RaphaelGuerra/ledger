/**
 * Numeric and formatting helpers used across components.
 */

/**
 * Convert a value to a finite number; returns 0 for blanks/invalid.
 * @param {unknown} value
 * @returns {number}
 */
export function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Whether a value should be treated as blank/empty.
 * @param {unknown} v
 * @returns {boolean}
 */
export function isBlank(v) {
  return v === '' || v === null || v === undefined
}

/**
 * Format a value with 2 decimal places, or empty when not a number.
 * @param {unknown} v
 * @returns {string}
 */
export function fmt2(v) {
  if (isBlank(v)) return ''
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : ''
}

/**
 * Format a value as BRL currency string (R$ xx.yy) or empty.
 * @param {unknown} v
 * @returns {string}
 */
export function fmtBRL(v) {
  if (isBlank(v)) return ''
  const n = Number(v)
  return Number.isFinite(n) ? `R$ ${n.toFixed(2)}` : ''
}

