import { isoAddDays, lastDayOfMonthStr } from './date.js'

/**
 * Given the visible rows for the active month, return which ISO dates should be
 * appended when the user taps "Adicionar Data". The function guarantees that
 * every missing day from the first day of the month up to the new last date is
 * filled, and it never goes past the final day of the month.
 *
 * @param {Array<{date?: string}>} visibleRows
 * @param {string} activeMonth YYYY-MM
 * @returns {string[]} ISO date strings to create
 */
export function computeDatesToAdd(visibleRows, activeMonth) {
  const monthStart = `${activeMonth}-01`
  const lastDay = lastDayOfMonthStr(activeMonth)
  const dates = (visibleRows || []).map(r => r?.date).filter(Boolean).sort()
  const have = new Set(dates)

  let target = monthStart
  if (dates.length > 0) {
    const last = dates[dates.length - 1]
    const next = isoAddDays(last, 1)
    target = next <= lastDay ? next : lastDay
  }

  const missing = []
  for (let d = monthStart; d <= target; d = isoAddDays(d, 1)) {
    if (!have.has(d)) missing.push(d)
  }
  return missing
}
