// UTC-safe date helpers for consistent behavior across timezones

export function formatDDMM(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return ''
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const [, , mm, dd] = m
  return `${dd}/${mm}`
}

export function isoAddDays(iso, days) {
  if (!iso) return iso
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function firstDayOfMonthStr(monthStr /* YYYY-MM */) {
  return `${monthStr}-01`
}

export function lastDayOfMonthStr(monthStr /* YYYY-MM */) {
  const [y, m] = monthStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m, 0)) // day 0 of next month
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * Human-friendly month label from YYYY-MM in pt-BR (e.g., "Setembro 2025").
 * @param {string} monthStr YYYY-MM
 * @returns {string}
 */
export function getMonthDisplayName(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, 1))
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Increment/decrement a YYYY-MM string by a number of months.
 * @param {string} monthStr YYYY-MM
 * @param {number} delta positive or negative months
 * @returns {string} new YYYY-MM
 */
export function incMonth(monthStr, delta) {
  const [year, month] = monthStr.split('-').map(Number)
  let newYear = year
  let newMonth = month + delta
  while (newMonth > 12) { newMonth -= 12; newYear += 1 }
  while (newMonth < 1) { newMonth += 12; newYear -= 1 }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`
}
