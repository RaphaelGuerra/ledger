import { useMemo, useState } from 'react'

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function createEmptyRow() {
  return {
    id: Math.random().toString(36).slice(2),
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    qtd: 0,
    debito: 0,
  }
}

// Caixa renders a running ledger.
// Saldo(n) = (has amount ? (QTD * Debito or Debito) + Saldo(n-1) : '')
export default function Caixa() {
  const [rows, setRows] = useState([createEmptyRow()])

  function updateRow(id, field, value) {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r
        if (field === 'data' || field === 'descricao') return { ...r, [field]: value }
        return { ...r, [field]: toNumberOrZero(value) }
      }),
    )
  }

  function addRow() {
    setRows(prev => [...prev, createEmptyRow()])
  }

  function removeRow(id) {
    setRows(prev => (prev.length === 1 ? prev : prev.filter(r => r.id !== id)))
  }

  const saldoRunning = useMemo(() => {
    const out = []
    let acc = 0
    for (const r of rows) {
      const qtd = toNumberOrZero(r.qtd)
      const deb = toNumberOrZero(r.debito)
      const hasQtd = r.qtd !== '' && r.qtd !== null && r.qtd !== undefined && !(Number.isNaN(Number(r.qtd)))
      const hasDeb = r.debito !== '' && r.debito !== null && r.debito !== undefined && !(Number.isNaN(Number(r.debito)))
      const amount = hasQtd && hasDeb ? qtd * deb : hasDeb ? deb : undefined
      if (typeof amount === 'number' && Number.isFinite(amount) && amount !== 0) {
        acc += amount
        out.push(acc)
      } else if (typeof amount === 'number' && amount === 0 && (hasQtd || hasDeb)) {
        // Explicit 0 amount counts as processed
        acc += 0
        out.push(acc)
      } else {
        out.push('')
      }
    }
    return out
  }, [rows])

  return (
    <section className="section">
      <h2 className="section-title">CAIXA</h2>
      <div className="table-wrap">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
              <th>Descricao</th>
              <th>QTD.</th>
              <th>Debito (R$)</th>
              <th className="readonly">Saldo (R$)</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id}>
                <td>
                  <input type="date" className="cell-input" value={r.data} onChange={e => updateRow(r.id, 'data', e.target.value)} />
                </td>
                <td>
                  <input className="cell-input readonly" readOnly value={saldoRunning[idx] !== '' ? 'PAGO' : ''} />
                </td>
                <td>
                  <input className="cell-input" value={r.descricao} onChange={e => updateRow(r.id, 'descricao', e.target.value)} placeholder="Descricao" />
                </td>
                <td>
                  <input type="number" inputMode="numeric" className="cell-input" value={r.qtd} onChange={e => updateRow(r.id, 'qtd', e.target.value)} />
                </td>
                <td>
                  <input type="number" inputMode="decimal" step="any" className="cell-input" value={r.debito} onChange={e => updateRow(r.id, 'debito', e.target.value)} />
                </td>
                <td>
                  <input className="cell-input readonly" readOnly value={saldoRunning[idx] === '' ? '' : Number(saldoRunning[idx]).toFixed(2)} />
                </td>
                <td>
                  <button className="link-button danger" onClick={() => removeRow(r.id)} disabled={rows.length === 1}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-actions">
        <button className="primary" onClick={addRow}>Adicionar Linha</button>
      </div>
    </section>
  )
}


