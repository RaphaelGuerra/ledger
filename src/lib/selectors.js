/**
 * Common selectors for filtering/sorting domain arrays.
 */

/**
 * Filter items that have a `date` starting with given YYYY-MM.
 * @template T extends { date?: string }
 * @param {T[]} arr
 * @param {string} month YYYY-MM
 * @returns {T[]}
 */
export function filterByMonth(arr, month) {
  const m = month || ''
  return (arr || []).filter(it => (it?.date || '').startsWith(m))
}

/**
 * Return a new array sorted by ascending date (lexicographic YYYY-MM-DD).
 * @template T extends { date?: string }
 * @param {T[]} arr
 * @returns {T[]}
 */
export function sortByDate(arr) {
  return [...(arr || [])].sort((a, b) => (a?.date || '').localeCompare(b?.date || ''))
}

/**
 * Convenience for entradas rows: filter by month then sort.
 * @param {Array<{date?: string}>} rows
 * @param {string} month YYYY-MM
 */
export function visibleEntradasRows(rows, month) {
  return sortByDate(filterByMonth(rows, month))
}

/**
 * Convenience for ledger items: filter by month then sort.
 * @param {Array<{date?: string}>} items
 * @param {string} month YYYY-MM
 */
export function visibleLedgerItems(items, month) {
  return sortByDate(filterByMonth(items, month))
}

