import { useMemo, useEffect, useState } from 'react'

function createEmptyShift() {
  return { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 }
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

  // Compact layout for very small screens
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(max-width: 420px)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(max-width: 420px)')
    const handler = (e) => setIsCompact(e.matches)
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else mql.removeListener(handler)
    }
  }, [])

  function updateShift(rowId, shiftKey, field, value) {
    onChange(
      rows.map(r => (r.id !== rowId ? r : { ...r, [shiftKey]: { ...r[shiftKey], [field]: toNumberOrZero(value) } })),
    )
  }

  function updateDate(rowId, value) {
    onChange(rows.map(r => (r.id === rowId ? { ...r, date: value } : r)))
  }

  function addDateRow() {
    let nextDate = `${activeMonth}-01`
    const valid = visibleRows.map(r => r.date).filter(Boolean).sort()
    if (valid.length > 0) {
      const last = new Date(valid[valid.length - 1])
      last.setDate(last.getDate() + 1)
      nextDate = last.toISOString().slice(0, 10)
    }
    onChange([...rows, createEmptyDateRow(nextDate)])
  }

  function removeDateRow(rowId) {
    onChange(rows.length === 1 ? rows : rows.filter(r => r.id !== rowId))
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

  if (isCompact) {
    return (
      <section className="section entradas-section">
        <h2 className="section-title">ENTRADAS DIARIAS</h2>
        <div className="entradas-cards">
          {visibleRows.map(r => {
            const t = totalsFor(r)
            return (
              <div key={r.id} className="entrada-card">
                <div className="card-header">
                  <input type="date" className="cell-input" value={r.date} onChange={e => updateDate(r.id, e.target.value)} />
                  <button className="link-button danger" onClick={() => removeDateRow(r.id)} disabled={rows.length === 1}>Remover</button>
                </div>
                <div className="card-group">
                  <div className="group-title">Dia</div>
                  <div className="field-grid">
                    <label className="field"><span className="field-label">N</span><input type="text" inputMode="numeric" pattern="[0-9]*" className="cell-input" value={r.dia.nEntradas} onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Total</span><input type="number" className="cell-input" value={r.dia.totalEntradas} onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Cozinha</span><input type="number" className="cell-input" value={r.dia.cozinha} onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Bar</span><input type="number" className="cell-input" value={r.dia.bar} onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Outros</span><input type="number" className="cell-input" value={r.dia.outros} onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)} /></label>
                  </div>
                </div>
                <div className="card-group">
                  <div className="group-title">Noite</div>
                  <div className="field-grid">
                    <label className="field"><span className="field-label">N</span><input type="text" inputMode="numeric" pattern="[0-9]*" className="cell-input" value={r.noite.nEntradas} onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Total</span><input type="number" className="cell-input" value={r.noite.totalEntradas} onChange={e => updateShift(r.id, 'noite', 'totalEntradas', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Cozinha</span><input type="number" className="cell-input" value={r.noite.cozinha} onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Bar</span><input type="number" className="cell-input" value={r.noite.bar} onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)} /></label>
                    <label className="field"><span className="field-label">Outros</span><input type="number" className="cell-input" value={r.noite.outros} onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)} /></label>
                  </div>
                </div>
                <div className="card-group totals">
                  <div className="group-title">Totais</div>
                  <div className="field-grid">
                    <label className="field"><span className="field-label">N</span><input className="cell-input readonly" readOnly value={t.nEntradas || ''} /></label>
                    <label className="field"><span className="field-label">Entradas</span><input className="cell-input readonly" readOnly value={t.totalEntradas || ''} /></label>
                    <label className="field"><span className="field-label">Cozinha</span><input className="cell-input readonly" readOnly value={t.cozinha || ''} /></label>
                    <label className="field"><span className="field-label">Bar</span><input className="cell-input readonly" readOnly value={t.bar || ''} /></label>
                    <label className="field"><span className="field-label">Outros</span><input className="cell-input readonly" readOnly value={t.outros || ''} /></label>
                    <label className="field"><span className="field-label">Média</span><input className="cell-input readonly" readOnly value={t.media || ''} /></label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="section-actions">
          <button className="primary" onClick={addDateRow}>Adicionar Data</button>
        </div>
      </section>
    )
  }

  return (
    <section className="section entradas-section">
      <h2 className="section-title">ENTRADAS DIARIAS</h2>
      <div className="table-wrap">
        <table className="sheet-table">
          <thead>
            <tr>
              <th rowSpan="2">Data</th>
              <th colSpan="5">Dia</th>
              <th colSpan="5">Noite</th>
              <th colSpan="6">Totais</th>
              <th rowSpan="2">Ações</th>
            </tr>
            <tr>
              <th>N</th>
              <th>Total</th>
              <th>Cozinha</th>
              <th>Bar</th>
              <th>Outros</th>
              <th>N</th>
              <th>Total</th>
              <th>Cozinha</th>
              <th>Bar</th>
              <th>Outros</th>
              <th>N</th>
              <th>Entradas</th>
              <th>Cozinha</th>
              <th>Bar</th>
              <th>Outros</th>
              <th>Média</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(r => {
              const t = totalsFor(r)
              return (
                <tr key={r.id}>
                  <td>
                    <input type="date" className="cell-input" value={r.date} onChange={e => updateDate(r.id, e.target.value)} />
                  </td>
                  <td><input type="text" inputMode="numeric" pattern="[0-9]*" className="cell-input" value={r.dia.nEntradas} onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.totalEntradas} onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.cozinha} onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.bar} onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.outros} onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)} /></td>
                  <td><input type="text" inputMode="numeric" pattern="[0-9]*" className="cell-input" value={r.noite.nEntradas} onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.noite.totalEntradas} onChange={e => updateShift(r.id, 'noite', 'totalEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.noite.cozinha} onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.noite.bar} onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.noite.outros} onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.nEntradas || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.totalEntradas || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.cozinha || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.bar || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.outros || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={t.media || ''} /></td>
                  <td>
                    <button className="link-button danger" onClick={() => removeDateRow(r.id)} disabled={rows.length === 1}>Remover</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="section-actions">
        <button className="primary" onClick={addDateRow}>Adicionar Data</button>
      </div>
    </section>
  )
}
