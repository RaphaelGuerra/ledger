import { Fragment, useState } from 'react'

function createEmptyShift() {
  return {
    nEntradas: 0,
    totalEntradas: 0,
    cozinha: 0,
    bar: 0,
    outros: 0,
  }
}

function createEmptyDateRow(dateString) {
  return {
    id: Math.random().toString(36).slice(2),
    date: dateString,
    dia: createEmptyShift(),
    noite: createEmptyShift(),
  }
}

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toDisplayValue(value) {
  // Convert 0 to empty string for better UX, but keep other values
  if (value === 0 || value === '0') return ''
  return value
}

// EntradasDiarias renders Day/ Night inputs by date and a total row per date.
// Totals sum Dia + Noite for each metric; Media = Total entradas / N. Entradas.
export default function EntradasDiarias({ rows, onChange, activeMonth }) {
  // State for expand/collapse
  const [expandedRowId, setExpandedRowId] = useState(null)
  
  // Filter rows by active month (prop from App)
  const visibleRows = rows.filter(r => r.date?.startsWith(activeMonth))

  function updateShift(rowId, shiftKey, field, value) {
    onChange(
      rows.map(r => {
        if (r.id !== rowId) return r
        return {
          ...r,
          [shiftKey]: {
            ...r[shiftKey],
            [field]: toNumberOrZero(value),
          },
        }
      }),
    )
  }

  function updateDate(rowId, value) {
    onChange(rows.map(r => (r.id === rowId ? { ...r, date: value } : r)))
  }

  function addDateRow() {
    // Find the last (most recent) date in current month and add one day
    let nextDate = `${activeMonth}-01` // Default to first day of active month
    
    if (visibleRows.length > 0) {
      // Get all valid dates in current month and sort them
      const validDates = visibleRows
        .map(r => r.date)
        .filter(date => date && date.trim() !== '')
        .sort()
      
      if (validDates.length > 0) {
        // Take the last (most recent) date and add one day
        const lastDate = new Date(validDates[validDates.length - 1])
        lastDate.setDate(lastDate.getDate() + 1)
        nextDate = lastDate.toISOString().slice(0, 10)
      }
    }
    
    const newRow = createEmptyDateRow(nextDate)
    onChange([...rows, newRow])
    // Auto-expand the new row for immediate editing
    setExpandedRowId(newRow.id)
  }
  
  function toggleRowExpansion(rowId) {
    setExpandedRowId(expandedRowId === rowId ? null : rowId)
  }
  
  // Month navigation is handled globally in App

  function removeDateRow(rowId) {
    // Close expanded row if it's being removed
    if (expandedRowId === rowId) {
      setExpandedRowId(null)
    }
    onChange(rows.length === 1 ? rows : rows.filter(r => r.id !== rowId))
  }

  function computeTotals(r) {
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
      
      {/* Scrollable Container */}
      <div className="entries-container">
        {visibleRows.length === 0 ? (
          <div className="empty-state">
            <p>Sem registros neste mês</p>
            <button className="primary" onClick={addDateRow}>
              Adicionar Primeiro Registro
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Turno</th>
                  <th>N. Entradas</th>
                  <th>Total (R$)</th>
                  <th>Média</th>
                  <th>Cozinha</th>
                  <th>Bar</th>
                  <th>Outros</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const totals = computeTotals(r)
                  const isExpanded = expandedRowId === r.id
                  
                  return (
                    <Fragment key={r.id}>
                      {!isExpanded ? (
                        // Collapsed Row - Show Dia/Noite/Total breakdown
                        <>
                          <tr className="collapsed-row">
                            <td rowSpan={3} className="date-cell">{r.date}</td>
                            <td className="shift-label">Dia</td>
                            <td>{r.dia.nEntradas}</td>
                            <td>R$ {r.dia.totalEntradas.toFixed(2)}</td>
                            <td>{r.dia.nEntradas > 0 ? `R$ ${(r.dia.totalEntradas / r.dia.nEntradas).toFixed(2)}` : ''}</td>
                            <td>R$ {r.dia.cozinha.toFixed(2)}</td>
                            <td>R$ {r.dia.bar.toFixed(2)}</td>
                            <td>R$ {r.dia.outros.toFixed(2)}</td>
                            <td rowSpan={3} className="actions-cell">
                              <button 
                                className="link-button primary" 
                                onClick={() => toggleRowExpansion(r.id)}
                                aria-expanded="false"
                              >
                                Editar
                              </button>
                              <button 
                                className="link-button danger" 
                                onClick={() => removeDateRow(r.id)} 
                                disabled={rows.length === 1}
                                style={{ marginLeft: '8px' }}
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                          <tr className="collapsed-row">
                            <td className="shift-label">Noite</td>
                            <td>{r.noite.nEntradas}</td>
                            <td>R$ {r.noite.totalEntradas.toFixed(2)}</td>
                            <td>{r.noite.nEntradas > 0 ? `R$ ${(r.noite.totalEntradas / r.noite.nEntradas).toFixed(2)}` : ''}</td>
                            <td>R$ {r.noite.cozinha.toFixed(2)}</td>
                            <td>R$ {r.noite.bar.toFixed(2)}</td>
                            <td>R$ {r.noite.outros.toFixed(2)}</td>
                          </tr>
                          <tr className="collapsed-row totals-row">
                            <td className="shift-label"><strong>Total</strong></td>
                            <td><strong>{totals.nEntradas}</strong></td>
                            <td><strong>R$ {totals.totalEntradas.toFixed(2)}</strong></td>
                            <td><strong>{typeof totals.media === 'number' ? `R$ ${totals.media.toFixed(2)}` : ''}</strong></td>
                            <td><strong>R$ {totals.cozinha.toFixed(2)}</strong></td>
                            <td><strong>R$ {totals.bar.toFixed(2)}</strong></td>
                            <td><strong>R$ {totals.outros.toFixed(2)}</strong></td>
                          </tr>
                        </>
                      ) : (
                        // Expanded Row - Full Editor
                        <>
                          <tr className="expanded-header">
                            <td colSpan={9}>
                              <strong>Editando: {r.date}</strong>
                              <button 
                                className="link-button" 
                                onClick={() => setExpandedRowId(null)}
                                style={{ float: 'right' }}
                                aria-expanded="true"
                              >
                                ✕ Fechar
                              </button>
                            </td>
                          </tr>
                          <tr className="expanded-row">
                            <td colSpan={9}>
                              <div className="expanded-editor">
                                <table className="editor-table">
                                  <thead>
                                    <tr>
                                      <th>Data</th>
                                      <th>Turno</th>
                                      <th>N. Entradas</th>
                                      <th>Total entradas (R$)</th>
                                      <th>Média entradas</th>
                                      <th>Cozinha</th>
                                      <th>Bar</th>
                                      <th>Outros</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td rowSpan={3}>
                                        <input
                                          type="date"
                                          value={r.date}
                                          onChange={e => updateDate(r.id, e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>Dia</td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={toDisplayValue(r.dia.nEntradas)}
                                          onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.dia.totalEntradas)}
                                          onChange={e => updateShift(r.id, 'dia', 'totalEntradas', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input value={r.dia.nEntradas > 0 ? (r.dia.totalEntradas / r.dia.nEntradas).toFixed(2) : ''} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.dia.cozinha)}
                                          onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.dia.bar)}
                                          onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.dia.outros)}
                                          onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Noite</td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={toDisplayValue(r.noite.nEntradas)}
                                          onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.noite.totalEntradas)}
                                          onChange={e => updateShift(r.id, 'noite', 'totalEntradas', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input value={r.noite.nEntradas > 0 ? (r.noite.totalEntradas / r.noite.nEntradas).toFixed(2) : ''} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.noite.cozinha)}
                                          onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.noite.bar)}
                                          onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          value={toDisplayValue(r.noite.outros)}
                                          onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)}
                                          className="cell-input"
                                        />
                                      </td>
                                    </tr>
                                    <tr className="subtotal-row">
                                      <td>Totais</td>
                                      <td>
                                        <input value={totals.nEntradas} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input value={totals.totalEntradas.toFixed(2)} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input value={typeof totals.media === 'number' ? totals.media.toFixed(2) : ''} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input value={totals.cozinha.toFixed(2)} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input value={totals.bar.toFixed(2)} readOnly className="cell-input readonly" />
                                      </td>
                                      <td>
                                        <input value={totals.outros.toFixed(2)} readOnly className="cell-input readonly" />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="section-actions">
        <button className="primary" onClick={addDateRow}>
          Adicionar Data
        </button>
        {visibleRows.length > 0 && (
          <button 
            className="secondary" 
            onClick={() => setExpandedRowId(null)}
            style={{ marginLeft: '8px' }}
          >
            Recolher Tudo
          </button>
        )}
      </div>
    </section>
  )
}


