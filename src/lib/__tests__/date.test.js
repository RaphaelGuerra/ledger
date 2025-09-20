import { describe, it, expect } from 'vitest'
import { formatDDMM, isoAddDays, firstDayOfMonthStr, lastDayOfMonthStr, getMonthDisplayName, incMonth } from '../../lib/date.js'

describe('date utils', () => {
  it('formatDDMM returns dd/mm', () => {
    expect(formatDDMM('2025-09-07')).toBe('07/09')
    expect(formatDDMM('bad')).toBe('')
  })

  it('isoAddDays keeps UTC and rolls over correctly', () => {
    expect(isoAddDays('2025-01-31', 1)).toBe('2025-02-01')
    expect(isoAddDays('2024-02-28', 1)).toBe('2024-02-29') // leap year
  })

  it('month boundaries produce correct strings', () => {
    expect(firstDayOfMonthStr('2025-09')).toBe('2025-09-01')
    expect(lastDayOfMonthStr('2025-09')).toBe('2025-09-30')
  })

  it('getMonthDisplayName capitalizes pt-BR month', () => {
    const s = getMonthDisplayName('2025-09')
    expect(s.toLowerCase()).toContain('2025')
  })

  it('incMonth increments and decrements months with year carry', () => {
    expect(incMonth('2025-12', 1)).toBe('2026-01')
    expect(incMonth('2025-01', -1)).toBe('2024-12')
    expect(incMonth('2025-05', 0)).toBe('2025-05')
  })
})

