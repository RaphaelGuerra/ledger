import { describe, it, expect } from 'vitest'
import { toNumberOrZero, isBlank, fmt2, fmtBRL } from '../../lib/number.js'

describe('number utils', () => {
  const normalizeSpacing = (value) => value.replace(/\s+/g, ' ')

  it('toNumberOrZero parses numbers and blanks to 0', () => {
    expect(toNumberOrZero(5)).toBe(5)
    expect(toNumberOrZero('3.2')).toBe(3.2)
    expect(toNumberOrZero('')).toBe(0)
    expect(toNumberOrZero(null)).toBe(0)
    expect(toNumberOrZero(undefined)).toBe(0)
    expect(toNumberOrZero('x')).toBe(0)
  })

  it('isBlank matches empty-like values', () => {
    expect(isBlank('')).toBe(true)
    expect(isBlank(null)).toBe(true)
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank(0)).toBe(false)
  })

  it('fmt2 formats finite numbers or returns empty', () => {
    expect(fmt2(1)).toBe('1,00')
    expect(fmt2('2.5')).toBe('2,50')
    expect(fmt2(0)).toBe('0,00')
    expect(fmt2(-12.34)).toBe('-12,34')
    expect(fmt2(1234567.89)).toBe('1.234.567,89')
    expect(fmt2('')).toBe('')
    expect(fmt2('x')).toBe('')
  })

  it('fmtBRL formats as currency', () => {
    expect(normalizeSpacing(fmtBRL(3))).toBe('R$ 3,00')
    expect(normalizeSpacing(fmtBRL('4.5'))).toBe('R$ 4,50')
    expect(normalizeSpacing(fmtBRL(-1200))).toBe('-R$ 1.200,00')
    expect(fmtBRL('')).toBe('')
  })
})
