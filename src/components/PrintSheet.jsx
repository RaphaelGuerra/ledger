import React, { useMemo } from 'react'
import { formatDDMM } from '../lib/date.js'

function toNumberOrZero(v) {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function isBlank(v) {
  return v === '' || v === null || v === undefined
}

export default function PrintSheet({
  hotelName,
  logoSrc,
  monthDisplay,
  syncId,
  creditTotals, // { totalCreditos }
  acumulado, // computed object from App
  ledgerItems, // full items; we filter by month
  entradasRows, // full rows; we filter by month
  activeMonth,
}) {
  const visibleLanc = useMemo(() => {
    const items = Array.isArray(ledgerItems) ? ledgerItems : []
    const filtered = items.filter(it => (it.date || '').startsWith(activeMonth))
    // rows with both descricao and valor populated
    const rows = filtered.filter(it => (typeof it.descricao === 'string' && it.descricao.trim() !== '') && !isBlank(it.valor))
    const sorted = [...rows].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    let saldo = 0
    const out = []
    for (const it of sorted) {
      const valor = toNumberOrZero(it.valor)
      saldo += valor
      out.push({ ...it, valor, saldo })
    }
    return out
  }, [ledgerItems, activeMonth])

  const lancTotals = useMemo(() => {
    const totalCreditos = toNumberOrZero(creditTotals?.totalCreditos || 0)
    const totalMovimentos = visibleLanc.reduce((s, it) => s + toNumberOrZero(it.valor), 0)
    return { totalCreditos, totalMovimentos, resultado: totalCreditos - totalMovimentos }
  }, [creditTotals, visibleLanc])

  // Split Lançamentos into up to 3 side-by-side tables to avoid page overflow
  const lancChunks = useMemo(() => {
    const n = visibleLanc.length
    const cols = n > 20 ? 3 : (n > 10 ? 2 : 1)
    if (cols === 1) return { cols, parts: [visibleLanc] }
    const per = Math.ceil(n / cols)
    const parts = []
    for (let i = 0; i < n; i += per) parts.push(visibleLanc.slice(i, i + per))
    return { cols, parts }
  }, [visibleLanc])

  const visibleEntradas = useMemo(() => {
    const rows = Array.isArray(entradasRows) ? entradasRows : []
    const filtered = rows.filter(r => (r.date || '').startsWith(activeMonth))
    // keep days that have any non-blank numeric field (0 counts as populated)
    function hasAny(r) {
      const fields = [r?.dia?.nEntradas, r?.dia?.totalEntradas, r?.dia?.cozinha, r?.dia?.bar, r?.dia?.outros, r?.noite?.nEntradas, r?.noite?.totalEntradas, r?.noite?.cozinha, r?.noite?.bar, r?.noite?.outros]
      return fields.some(v => v === 0 || (!isBlank(v) && !Number.isNaN(Number(v))))
    }
    return filtered.filter(hasAny).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [entradasRows, activeMonth])

  // Split visible entradas into two groups for print: days 1–15 and 16–31
  const entradasLeft = useMemo(() => {
    return visibleEntradas.filter(r => {
      const d = Number((r.date || '').slice(8, 10))
      return Number.isFinite(d) && d <= 15
    })
  }, [visibleEntradas])
  const entradasRight = useMemo(() => {
    return visibleEntradas.filter(r => {
      const d = Number((r.date || '').slice(8, 10))
      return Number.isFinite(d) && d >= 16
    })
  }, [visibleEntradas])

  function fmt2(v) {
    const n = Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : ''
  }

  return (
    <div className="print-root">
      <header className="print-header">
        <div className="ph-left">
          {logoSrc ? <img src={logoSrc} alt="Logo" className="print-logo" /> : null}
          <div className="ph-brand">{hotelName}</div>
        </div>
        <div className="ph-right">
          <div><strong>Mês:</strong> {monthDisplay}</div>
          {syncId ? <div><strong>ID:</strong> {syncId}</div> : null}
          <div><strong>Impresso:</strong> {new Date().toLocaleString('pt-BR')}</div>
        </div>
      </header>

      <section className="print-section">
        <div className="print-grid-3">
          <div className="print-card">
            <div className="plabel">Créditos</div>
            <div className="pvalue">{fmt2(lancTotals.totalCreditos)}</div>
          </div>
          <div className="print-card">
            <div className="plabel">Movimentos</div>
            <div className="pvalue">{fmt2(lancTotals.totalMovimentos)}</div>
          </div>
          <div className="print-card">
            <div className="plabel">Resultado</div>
            <div className="pvalue">{fmt2(lancTotals.resultado)}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <table className="print-table">
          <thead>
            <tr>
              <th>Entradas (N)</th>
              <th>Diárias</th>
              <th>Média</th>
              <th>Cozinha</th>
              <th>Bar</th>
              <th>Outros</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="num">{acumulado?.total?.n || 0}</td>
              <td className="num">{fmt2(acumulado?.total?.entradas || 0)}</td>
              <td className="num">{fmt2(acumulado?.total?.media)}</td>
              <td className="num">{fmt2(acumulado?.total?.cozinha || 0)}</td>
              <td className="num">{fmt2(acumulado?.total?.bar || 0)}</td>
              <td className="num">{fmt2(acumulado?.total?.outros || 0)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h3 className="print-subtitle">Lançamentos</h3>
        {lancChunks.cols === 1 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {lancChunks.parts[0].map((it) => (
                <tr key={it.id}>
                  <td>{formatDDMM(it.date)}</td>
                  <td>{it.descricao}</td>
                  <td className="num">{fmt2(it.valor)}</td>
                  <td className="num">{fmt2(it.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={lancChunks.cols === 3 ? 'print-grid-3' : 'print-grid-2'}>
            {lancChunks.parts.map((chunk, idx) => (
              <div className="print-card" key={idx}>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map(it => (
                      <tr key={it.id}>
                        <td>{formatDDMM(it.date)}</td>
                        <td>{it.descricao}</td>
                        <td className="num">{fmt2(it.valor)}</td>
                        <td className="num">{fmt2(it.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="print-section">
        <h3 className="print-subtitle">Entradas</h3>
        <div className="print-grid-2">
          <div className="print-card">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Turno</th>
                  <th>Entradas</th>
                  <th>Diárias</th>
                  <th>Média</th>
                  <th>Cozinha</th>
                  <th>Bar</th>
                  <th>Outros</th>
                </tr>
              </thead>
              <tbody>
                {entradasLeft.map(r => {
                  const diaMedia = r.dia?.nEntradas > 0 ? (toNumberOrZero(r.dia.totalEntradas) / toNumberOrZero(r.dia.nEntradas)) : ''
                  const noiteMedia = r.noite?.nEntradas > 0 ? (toNumberOrZero(r.noite.totalEntradas) / toNumberOrZero(r.noite.nEntradas)) : ''
                  const totN = toNumberOrZero(r.dia.nEntradas) + toNumberOrZero(r.noite.nEntradas)
                  const totEntr = toNumberOrZero(r.dia.totalEntradas) + toNumberOrZero(r.noite.totalEntradas)
                  const totC = toNumberOrZero(r.dia.cozinha) + toNumberOrZero(r.noite.cozinha)
                  const totB = toNumberOrZero(r.dia.bar) + toNumberOrZero(r.noite.bar)
                  const totO = toNumberOrZero(r.dia.outros) + toNumberOrZero(r.noite.outros)
                  const totMedia = totN > 0 ? (totEntr / totN) : ''
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="pgroup-start">
                        <td rowSpan={3}>{formatDDMM(r.date)}</td>
                        <td>Dia</td>
                        <td className="num">{r.dia.nEntradas || ''}</td>
                        <td className="num">{fmt2(r.dia.totalEntradas)}</td>
                        <td className="num">{fmt2(diaMedia)}</td>
                        <td className="num">{fmt2(r.dia.cozinha)}</td>
                        <td className="num">{fmt2(r.dia.bar)}</td>
                        <td className="num">{fmt2(r.dia.outros)}</td>
                      </tr>
                      <tr>
                        <td>Noite</td>
                        <td className="num">{r.noite.nEntradas || ''}</td>
                        <td className="num">{fmt2(r.noite.totalEntradas)}</td>
                        <td className="num">{fmt2(noiteMedia)}</td>
                        <td className="num">{fmt2(r.noite.cozinha)}</td>
                        <td className="num">{fmt2(r.noite.bar)}</td>
                        <td className="num">{fmt2(r.noite.outros)}</td>
                      </tr>
                      <tr className="ptotal-row">
                        <td>Total</td>
                        <td className="num">{totN}</td>
                        <td className="num">{fmt2(totEntr)}</td>
                        <td className="num">{fmt2(totMedia)}</td>
                        <td className="num">{fmt2(totC)}</td>
                        <td className="num">{fmt2(totB)}</td>
                        <td className="num">{fmt2(totO)}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="print-card">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Turno</th>
                  <th>Entradas</th>
                  <th>Diárias</th>
                  <th>Média</th>
                  <th>Cozinha</th>
                  <th>Bar</th>
                  <th>Outros</th>
                </tr>
              </thead>
              <tbody>
                {entradasRight.map(r => {
                  const diaMedia = r.dia?.nEntradas > 0 ? (toNumberOrZero(r.dia.totalEntradas) / toNumberOrZero(r.dia.nEntradas)) : ''
                  const noiteMedia = r.noite?.nEntradas > 0 ? (toNumberOrZero(r.noite.totalEntradas) / toNumberOrZero(r.noite.nEntradas)) : ''
                  const totN = toNumberOrZero(r.dia.nEntradas) + toNumberOrZero(r.noite.nEntradas)
                  const totEntr = toNumberOrZero(r.dia.totalEntradas) + toNumberOrZero(r.noite.totalEntradas)
                  const totC = toNumberOrZero(r.dia.cozinha) + toNumberOrZero(r.noite.cozinha)
                  const totB = toNumberOrZero(r.dia.bar) + toNumberOrZero(r.noite.bar)
                  const totO = toNumberOrZero(r.dia.outros) + toNumberOrZero(r.noite.outros)
                  const totMedia = totN > 0 ? (totEntr / totN) : ''
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="pgroup-start">
                        <td rowSpan={3}>{formatDDMM(r.date)}</td>
                        <td>Dia</td>
                        <td className="num">{r.dia.nEntradas || ''}</td>
                        <td className="num">{fmt2(r.dia.totalEntradas)}</td>
                        <td className="num">{fmt2(diaMedia)}</td>
                        <td className="num">{fmt2(r.dia.cozinha)}</td>
                        <td className="num">{fmt2(r.dia.bar)}</td>
                        <td className="num">{fmt2(r.dia.outros)}</td>
                      </tr>
                      <tr>
                        <td>Noite</td>
                        <td className="num">{r.noite.nEntradas || ''}</td>
                        <td className="num">{fmt2(r.noite.totalEntradas)}</td>
                        <td className="num">{fmt2(noiteMedia)}</td>
                        <td className="num">{fmt2(r.noite.cozinha)}</td>
                        <td className="num">{fmt2(r.noite.bar)}</td>
                        <td className="num">{fmt2(r.noite.outros)}</td>
                      </tr>
                      <tr className="ptotal-row">
                        <td>Total</td>
                        <td className="num">{totN}</td>
                        <td className="num">{fmt2(totEntr)}</td>
                        <td className="num">{fmt2(totMedia)}</td>
                        <td className="num">{fmt2(totC)}</td>
                        <td className="num">{fmt2(totB)}</td>
                        <td className="num">{fmt2(totO)}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
