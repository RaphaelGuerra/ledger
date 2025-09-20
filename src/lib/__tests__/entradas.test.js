import { describe, expect, test } from 'vitest'
import { computeDatesToAdd } from '../entradas.js'

describe('computeDatesToAdd', () => {
  test('adds first day when there are no rows', () => {
    const dates = computeDatesToAdd([], '2025-03')
    expect(dates).toEqual(['2025-03-01'])
  })

  test('fills gaps up to next sequential date', () => {
    const rows = [
      { date: '2025-03-01' },
      { date: '2025-03-03' },
      { date: '2025-03-05' },
    ]
    const dates = computeDatesToAdd(rows, '2025-03')
    expect(dates).toEqual(['2025-03-02', '2025-03-04', '2025-03-06'])
  })

  test('adds next sequential day when month has no gaps yet', () => {
    const rows = [
      { date: '2025-02-01' },
      { date: '2025-02-02' },
      { date: '2025-02-03' },
    ]
    const dates = computeDatesToAdd(rows, '2025-02')
    expect(dates).toEqual(['2025-02-04'])
  })

  test('returns empty when every day of the month is present', () => {
    const full = Array.from({ length: 29 }, (_, idx) => ({ date: `2024-02-${String(idx + 1).padStart(2, '0')}` }))
    const fullDates = computeDatesToAdd(full, '2024-02')
    expect(fullDates).toEqual([])
  })

  test('clamps to month end when last row already on final day', () => {
    const rows = [
      { date: '2025-01-01' },
      { date: '2025-01-31' },
    ]
    const dates = computeDatesToAdd(rows, '2025-01')
    expect(dates[0]).toBe('2025-01-02')
    expect(dates.at(-1)).toBe('2025-01-30')
    expect(dates).toHaveLength(29)
  })
})
