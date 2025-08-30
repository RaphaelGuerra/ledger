import { describe, it, expect } from 'vitest'
import { toCentavos, fromCentavos, applyRate } from './money.js'

describe('money utils', () => {
  it('converts to and from centavos', () => {
    expect(toCentavos('R$ 10,50')).toBe(1050n)
    expect(fromCentavos(1050n)).toBe('R$ 10,50')
  })

  it('applies rate with bankers rounding', () => {
    expect(applyRate(1000n, '0.1')).toBe(100n)
    // 1 cent * 0.5 = 0.5 -> bankers round to even => 0
    expect(applyRate(1n, '0.5')).toBe(0n)
    // 3 cents * 0.5 = 1.5 -> banker's round -> 2
    expect(applyRate(3n, '0.5')).toBe(2n)
  })
})
