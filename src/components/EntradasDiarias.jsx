import { useMemo } from 'react'

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

  return (
    <section className="section entradas-section">
      <h2 className="section-title">ENTRADAS DIARIAS</h2>
      <div className="table-wrap">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Dia N</th>
              <th>Dia Total</th>
              <th>Dia Cozinha</th>
              <th>Dia Bar</th>
              <th>Dia Outros</th>
              <th>Noite N</th>
              <th>Noite Total</th>
              <th>Noite Cozinha</th>
              <th>Noite Bar</th>
              <th>Noite Outros</th>
              <th>Tot N</th>
              <th>Tot Entradas</th>
              <th>Tot Cozinha</th>
              <th>Tot Bar</th>
              <th>Tot Outros</th>
              <th>Média</th>
              <th>Ações</th>
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
                  <td><input type="number" className="cell-input" value={r.dia.nEntradas} onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.totalEntradas} onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.cozinha} onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.bar} onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.dia.outros} onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)} /></td>
                  <td><input type="number" className="cell-input" value={r.noite.nEntradas} onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)} /></td>
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

