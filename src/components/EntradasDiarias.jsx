import React, { useMemo, useState } from 'react'
import { formatDDMM, isoAddDays, lastDayOfMonthStr } from '../lib/date.js'

function createEmptyShift() {
  return { nEntradas: '', totalEntradas: '', cozinha: '', bar: '', outros: '' }
}

export function createEmptyDateRow(dateString) {
  return { id: Math.random().toString(36).slice(2), date: dateString, dia: createEmptyShift(), noite: createEmptyShift() }
}

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function EntradasDiarias({ rows, onChange, activeMonth }) {
  const visibleRows = useMemo(() => rows.filter(r => r.date?.startsWith(activeMonth)), [rows, activeMonth])
  const sortedRows = useMemo(() => [...visibleRows].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [visibleRows])
  const addDisabled = useMemo(() => {
    const valid = visibleRows.map(r => r.date).filter(Boolean).sort()
    const nextDate = valid.length > 0 ? isoAddDays(valid[valid.length - 1], 1) : `${activeMonth}-01`
    return (nextDate || '') > lastDayOfMonthStr(activeMonth)
  }, [visibleRows, activeMonth])
  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded(prev => (prev[id] ? {} : { [id]: true }))

  // Collapse when clicking outside any ent-card (mobile cards)
  React.useEffect(() => {
    function onOutside(e) {
      const target = e.target
      if (!(target instanceof Element)) return
      const inCard = target.closest('.ent-card')
      if (!inCard) setExpanded({})
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [])

  function fillMonth() {
    // Generate every missing date from the next date through the last day of the month
    const have = new Set(visibleRows.map(r => r.date))
    let nextDate = `${activeMonth}-01`
    if (have.size > 0) {
      const sorted = [...have].sort()
      nextDate = isoAddDays(sorted[sorted.length - 1], 1)
    }
    const last = lastDayOfMonthStr(activeMonth)
    const newRows = []
    for (let d = nextDate; d <= last; d = isoAddDays(d, 1)) {
      if (!have.has(d)) newRows.push(createEmptyDateRow(d))
    }
    if (newRows.length) onChange([...rows, ...newRows])
  }


  function updateShift(rowId, shiftKey, field, value) {
    onChange(
      rows.map(r => (
        r.id !== rowId
          ? r
          : { ...r, [shiftKey]: { ...r[shiftKey], [field]: value === '' ? '' : toNumberOrZero(value) } }
      )),
    )
  }

  function updateDate(rowId, value) {
    onChange(rows.map(r => (r.id === rowId ? { ...r, date: value } : r)))
  }


  function addDateRow() {
    // Determine the next date to add (day after the latest existing date, or 01)
    let nextDate = `${activeMonth}-01`
    const valid = visibleRows.map(r => r.date).filter(Boolean).sort()
    if (valid.length > 0) {
      nextDate = isoAddDays(valid[valid.length - 1], 1)
    }
    const lastDay = lastDayOfMonthStr(activeMonth)
    if ((nextDate || '') > lastDay) return // do not add beyond month

    // Auto-fill any missing dates from the 1st up to nextDate (inclusive)
    const have = new Set(visibleRows.map(r => r.date))
    const newRows = []
    for (let d = `${activeMonth}-01`; d <= nextDate; d = isoAddDays(d, 1)) {
      if (!have.has(d)) newRows.push(createEmptyDateRow(d))
    }
    if (newRows.length === 0) return
    onChange([...rows, ...newRows])
  }

  function removeDateRow(rowId) {
    onChange(rows.filter(r => r.id !== rowId))
  }

  function totalsFor(r) {
    const sum = (a, b) => toNumberOrZero(a) + toNumberOrZero(b)
    const nEntradas = sum(r.dia.nEntradas, r.noite.nEntradas)
    const totalEntradas = sum(r.dia.totalEntradas, r.noite.totalEntradas)
    const cozinha = sum(r.dia.cozinha, r.noite.cozinha)
    const bar = sum(r.dia.bar, r.noite.bar)
    const outros = sum(r.dia.outros, r.noite.outros)
    const media = nEntradas > 0 ? totalEntradas / nEntradas : ''
    return { nEntradas, totalEntradas, cozinha, bar, outros, media }
  }

  function fmtBRL(v) {
    if (v === '' || v === null || v === undefined || Number.isNaN(Number(v))) return ''
    return `R$ ${Number(v).toFixed(2)}`
  }

  function fmt2(v) {
    if (v === '' || v === null || v === undefined) return ''
    const n = Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : ''
  }

  return (
    <section className="section entradas-section">
      <h2 className="section-title">Entradas</h2>
      <div className="entries-container desktop-only">
        {sortedRows.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma entrada no mês. Use "Adicionar Data" ou "Preencher Mês".</p>
          </div>
        )}
        <div className="table-wrap">
          <table className="sheet-table diarias-table">
            <tbody>
              {sortedRows.map(r => {
                const t = totalsFor(r)
                const mediaDia = r.dia.nEntradas > 0 ? r.dia.totalEntradas / r.dia.nEntradas : ''
                const mediaNoite = r.noite.nEntradas > 0 ? r.noite.totalEntradas / r.noite.nEntradas : ''
                return (
                  <React.Fragment key={r.id}>
                    <tr className="entry-header">
                      <th className="turno-date-cell">
                        <div className="date-compact-wrap">
                          <input type="date" lang="pt-BR" className="cell-input date-compact" value={r.date} disabled />
                          <div className="date-overlay">{formatDDMM(r.date)}</div>
                        </div>
                      </th>
                      <th>Entradas</th>
                      <th>Diárias</th>
                      <th>Média</th>
                      <th>Cozinha</th>
                      <th>Bar</th>
                      <th>Outros</th>
                      <th className="actions-cell">
                        <button className="link-button danger icon" style={{ color: 'var(--danger)' }} aria-label="Remover" title="Remover" onClick={() => removeDateRow(r.id)}>✖</button>
                      </th>
                    </tr>
                    <tr className="collapsed-row">
                      <td className="shift-label">Dia</td>
                      <td><input className="cell-input" inputMode="numeric" value={r.dia.nEntradas} onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)} /></td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.dia.totalEntradas} onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(mediaDia)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.dia.cozinha} onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.dia.bar} onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.dia.outros} onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)} />
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    <tr className="collapsed-row">
                      <td className="shift-label">Noite</td>
                      <td><input className="cell-input" inputMode="numeric" value={r.noite.nEntradas} onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)} /></td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.noite.totalEntradas} onChange={e => updateShift(r.id, 'noite', 'totalEntradas', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(mediaNoite)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.noite.cozinha} onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.noite.bar} onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input" type="number" value={r.noite.outros} onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)} />
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    <tr className="subtotal-row">
                      <td className="shift-label">Total</td>
                      <td><input className="cell-input readonly" readOnly value={t.nEntradas || ''} /></td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(t.totalEntradas)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(t.media)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(t.cozinha)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(t.bar)} />
                        </div>
                      </td>
                      <td>
                        <div className="currency-input"><span className="prefix">R$</span>
                          <input className="cell-input readonly" readOnly value={fmt2(t.outros)} />
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only">
        <div className="ent-cards">
          {sortedRows.length === 0 ? (
            <div className="empty-state"><p>Nenhuma entrada no mês. Use "Adicionar Data" ou "Preencher Mês".</p></div>
          ) : sortedRows.map(r => {
            const t = totalsFor(r)
            const isOpen = !!expanded[r.id]
            return (
              <div key={r.id} className={`ent-card${isOpen ? ' open' : ''}`}>
                <div className="ent-card-header">
                  {isOpen ? (
                    <div className="date-compact-wrap" style={{ width: 90 }}>
                      <input type="date" lang="pt-BR" className="cell-input date-compact" value={r.date} disabled />
                      <div className="date-overlay">{formatDDMM(r.date)}</div>
                    </div>
                  ) : (
                    <div className="date-display">{formatDDMM(r.date)}</div>
                  )}
                  <div className="summary">
                    <span>Entradas <span className="val">{t.nEntradas || 0}</span></span>
                    <span>Diárias <span className="val">R$ {t.totalEntradas || 0}</span></span>
                  </div>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="expand-toggle" onClick={() => toggle(r.id)}>{isOpen ? 'Recolher' : 'Expandir'}</button>
                    <button
                      className="link-button danger icon"
                      style={{ color: 'var(--danger)' }}
                      aria-label="Remover"
                      title="Remover"
                      onClick={() => removeDateRow(r.id)}
                    >
                      ✖
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div>
                    <div className="row-title">Dia</div>
                    <div className="grid">
                      <div className="currency-input"><span className="prefix">Entradas</span>
                        <input className="cell-input" inputMode="numeric" value={r.dia.nEntradas} onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Diárias</span>
                        <input className="cell-input" type="number" value={r.dia.totalEntradas} onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Média</span>
                        <input className="cell-input" readOnly value={fmt2(r.dia.nEntradas > 0 ? (r.dia.totalEntradas / r.dia.nEntradas) : '')} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Cozinha</span>
                        <input className="cell-input" type="number" value={r.dia.cozinha} onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Bar</span>
                        <input className="cell-input" type="number" value={r.dia.bar} onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Outros</span>
                        <input className="cell-input" type="number" value={r.dia.outros} onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)} />
                      </div>
                    </div>
                    <div className="row-title">Noite</div>
                    <div className="grid">
                      <div className="currency-input"><span className="prefix">Entradas</span>
                        <input className="cell-input" inputMode="numeric" value={r.noite.nEntradas} onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Diárias</span>
                        <input className="cell-input" type="number" value={r.noite.totalEntradas} onChange={e => updateShift(r.id, 'noite', 'totalEntradas', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Média</span>
                        <input className="cell-input" readOnly value={fmt2(r.noite.nEntradas > 0 ? (r.noite.totalEntradas / r.noite.nEntradas) : '')} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Cozinha</span>
                        <input className="cell-input" type="number" value={r.noite.cozinha} onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Bar</span>
                        <input className="cell-input" type="number" value={r.noite.bar} onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)} />
                      </div>
                      <div className="currency-input"><span className="prefix">R$ Outros</span>
                        <input className="cell-input" type="number" value={r.noite.outros} onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="section-actions">
        <button className="primary" onClick={addDateRow} disabled={addDisabled}>Adicionar Data</button>
        <button className="secondary" onClick={fillMonth} disabled={addDisabled}>Preencher Mês</button>
        {addDisabled && (
          <span className="disabled-hint"><span className="info-icon" aria-hidden>ⓘ</span>Não há mais dias neste mês para adicionar.</span>
        )}
      </div>
    </section>
  )
}
