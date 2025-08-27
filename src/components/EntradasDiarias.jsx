import { Fragment } from 'react'

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

// EntradasDiarias renders Day/ Night inputs by date and a total row per date.
// Totals sum Dia + Noite for each metric; Media = Total entradas / N. Entradas.
export default function EntradasDiarias({ rows, onChange }) {
  const today = new Date().toISOString().slice(0, 10)

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
    onChange([...rows, createEmptyDateRow(today)])
  }

  function removeDateRow(rowId) {
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
    <section className="section">
      <h2 className="section-title">ENTRADAS DIARIAS</h2>
      <div className="table-wrap">
        <table className="sheet-table">
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const totals = computeTotals(r)
              return (
                <Fragment key={r.id}>
                  <tr key={r.id + '-dia'}>
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
                        value={r.dia.nEntradas}
                        onChange={e => updateShift(r.id, 'dia', 'nEntradas', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.dia.totalEntradas}
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
                        value={r.dia.cozinha}
                        onChange={e => updateShift(r.id, 'dia', 'cozinha', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.dia.bar}
                        onChange={e => updateShift(r.id, 'dia', 'bar', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.dia.outros}
                        onChange={e => updateShift(r.id, 'dia', 'outros', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td rowSpan={3}>
                      <button className="link-button danger" onClick={() => removeDateRow(r.id)} disabled={rows.length === 1}>
                        Remover
                      </button>
                    </td>
                  </tr>
                  <tr key={r.id + '-noite'}>
                    <td>Noite</td>
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={r.noite.nEntradas}
                        onChange={e => updateShift(r.id, 'noite', 'nEntradas', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.noite.totalEntradas}
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
                        value={r.noite.cozinha}
                        onChange={e => updateShift(r.id, 'noite', 'cozinha', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.noite.bar}
                        onChange={e => updateShift(r.id, 'noite', 'bar', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={r.noite.outros}
                        onChange={e => updateShift(r.id, 'noite', 'outros', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                  </tr>
                  <tr key={r.id + '-total'} className="subtotal-row">
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
                </Fragment>
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


