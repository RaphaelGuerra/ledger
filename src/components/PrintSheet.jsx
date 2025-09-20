import React, { useMemo } from 'react'
import { formatDDMM } from '../lib/date.js'
import { toNumberOrZero, isBlank, fmt2 } from '../lib/number.js'

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

  // Split Lançamentos into pages. Each column has up to 8 rows and each page has up to 4 columns.
  const lancPages = useMemo(() => {
    const all = visibleLanc
    const columns = []
    for (let i = 0; i < all.length; i += 8) columns.push(all.slice(i, i + 8))
    const pages = []
    for (let i = 0; i < columns.length; i += 4) {
      pages.push(columns.slice(i, i + 4))
    }
    return { pages, total: all.length }
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

  // formatting helper moved to lib/number.js

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
            <div className="print-kv"><span className="plabel">Créditos</span><span className="pvalue">{fmt2(lancTotals.totalCreditos)}</span></div>
          </div>
          <div className="print-card">
            <div className="print-kv"><span className="plabel">Movimentos</span><span className="pvalue">{fmt2(lancTotals.totalMovimentos)}</span></div>
          </div>
          <div className="print-card">
            <div className="print-kv"><span className="plabel">Resultado</span><span className="pvalue">{fmt2(lancTotals.resultado)}</span></div>
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
        {lancPages.pages.length === 0 ? null : (
          lancPages.pages.map((pageChunks, pageIdx) => {
            const isSingleColumn = pageChunks.length === 1
            const gridClass = pageChunks.length === 4 ? 'print-grid-4' : (pageChunks.length === 3 ? 'print-grid-3' : 'print-grid-2')
            const tableHeader = (
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Saldo</th>
                </tr>
              </thead>
            )
            const tableBody = chunk => (
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
            )
            return (
              <React.Fragment key={pageIdx}>
                {pageIdx > 0 && (
                  <>
                    <div className="print-page-break" aria-hidden="true" />
                    <h3 className="print-subtitle print-subtitle--continued">Lançamentos (continuação)</h3>
                  </>
                )}
                <div className="print-lanc-page">
                  {isSingleColumn ? (
                    <table className="print-table">
                      {tableHeader}
                      {tableBody(pageChunks[0])}
                    </table>
                  ) : (
                    <div className={gridClass}>
                      {pageChunks.map((chunk, idx) => (
                        <div className="print-card print-card--table" key={idx}>
                          <table className="print-table">
                            {tableHeader}
                            {tableBody(chunk)}
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                  {pageIdx < lancPages.pages.length - 1 ? (
                    <div className="print-note">Continua na próxima página…</div>
                  ) : null}
                </div>
              </React.Fragment>
            )
          })
        )}
      </section>

      <section className="print-section">
        <h3 className="print-subtitle">Entradas</h3>
        <div className="print-grid-2">
          <div className="print-card print-card--table">
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
          <div className="print-card print-card--table">
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
