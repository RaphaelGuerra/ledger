import { describe, it, expect } from 'vitest'
import { computeCreditTotals, computeAcumulado } from '../../lib/stats.js'

const row = (date, d, n) => ({ date, dia: d, noite: n })
const s = (nEntradas, totalEntradas, cozinha, bar, outros) => ({ nEntradas, totalEntradas, cozinha, bar, outros })

describe('stats utils', () => {
  it('computeCreditTotals sums fields from rows', () => {
    const rows = [
      row('2025-09-01', s(1, 50, 10, 5, 2), s(2, 80, 15, 7, 3)),
      row('2025-09-02', s(0,  0,  3, 1, 1), s(1, 40,  8, 4, 2)),
    ]
    const t = computeCreditTotals(rows)
    expect(t.totalEntradas).toBe(170)
    expect(t.totalCozinha).toBe(36)
    expect(t.totalBar).toBe(17)
    expect(t.totalOutros).toBe(8)
    expect(t.totalCreditos).toBe(231)
  })

  it('computeAcumulado calculates per-shift and totals with media', () => {
    const rows = [
      row('2025-09-01', s(1, 50, 10, 5, 2), s(2, 80, 15, 7, 3)),
      row('2025-09-02', s(0,  0,  3, 1, 1), s(1, 40,  8, 4, 2)),
    ]
    const a = computeAcumulado(rows)
    expect(a.dia.n).toBe(1)
    expect(a.noite.n).toBe(3)
    expect(a.total.n).toBe(4)
    expect(a.total.entradas).toBe(50 + 0 + 80 + 40)
    expect(a.total.bar).toBe(5 + 1 + 7 + 4)
    expect(typeof a.total.media === 'number').toBe(true)
  })
})

