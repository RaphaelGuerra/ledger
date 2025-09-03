import { useMemo, useState, useEffect } from 'react'

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function createEmptyItem(defaultDate) {
  return {
    id: Math.random().toString(36).slice(2),
    date: defaultDate || new Date().toISOString().slice(0, 10),
    descricao: '',
    valor: 0, // positive for credit, negative for debit
  }
}

function migrateItems(items, activeMonth) {
  if (!Array.isArray(items)) return []
  return items.map(it => {
    if (typeof it?.valor === 'number') return { id: it.id || Math.random().toString(36).slice(2), date: it.date, descricao: it.descricao || '', valor: it.valor }
    // legacy conversion
    if (it?.type === 'mov') {
      const deb = toNumberOrZero(it.debito)
      const cre = toNumberOrZero(it.credito)
      const valor = cre - deb
      return { id: it.id || Math.random().toString(36).slice(2), date: it.date, descricao: it.descricao || '', valor }
    } else {
      const qtd = toNumberOrZero(it.qtd)
      const deb = toNumberOrZero(it.debito)
      const raw = qtd ? qtd * deb : deb
      const valor = -raw
      return { id: it.id || Math.random().toString(36).slice(2), date: it.date, descricao: it.descricao || '', valor }
    }
  })
}

export default function Ledger({ creditTotals, activeMonth, initialItems, onItemsChange }) {
  const [items, setItems] = useState(() => {
    const initialDate = (activeMonth ? `${activeMonth}-01` : new Date().toISOString().slice(0, 10))
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) return migrateItems(initialItems, activeMonth)
    return [createEmptyItem(initialDate)]
  })

  // Reset when month or initialItems change
  useEffect(() => {
    const first = `${activeMonth}-01`
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
      setItems(migrateItems(initialItems, activeMonth))
    } else {
      setItems([createEmptyItem(first)])
    }
  }, [activeMonth, initialItems])

  // Ensure at least one mov and one desp item for the month
  useEffect(() => {
    const monthFirstDay = `${activeMonth}-01`
    setItems(prev => {
      const hasAny = prev.some(it => (it.date || '').startsWith(activeMonth))
      return hasAny ? prev : [...prev, createEmptyItem(monthFirstDay)]
    })
  }, [activeMonth])

  // Notify parent to persist
  useEffect(() => { onItemsChange && onItemsChange(items) }, [items, onItemsChange])

  const visibleItems = useMemo(() => items.filter(it => (it.date || '').startsWith(activeMonth)), [items, activeMonth])
  const sorted = useMemo(() => [...visibleItems].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [visibleItems])

  function addItem() {
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    let nextDate = `${activeMonth}-01`
    if (validDates.length > 0) {
      const lastDate = new Date(validDates[validDates.length - 1])
      lastDate.setDate(lastDate.getDate() + 1)
      nextDate = lastDate.toISOString().slice(0, 10)
    }
    setItems(prev => [...prev, createEmptyItem(nextDate)])
  }

  function removeItem(id) {
    setItems(prev => (prev.length === 1 ? prev : prev.filter(it => it.id !== id)))
  }

  function updateItem(id, field, value) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      if (['date', 'descricao'].includes(field)) return { ...it, [field]: value }
      return { ...it, [field]: toNumberOrZero(value) }
    }))
  }

  const rowResults = useMemo(() => {
    const results = []
    let saldo = 0
    for (const it of sorted) {
      const hasVal = it.valor !== '' && it.valor !== null && it.valor !== undefined && !Number.isNaN(Number(it.valor))
      const resultado = hasVal ? toNumberOrZero(it.valor) : ''
      if (typeof resultado === 'number') saldo += resultado
      results.push({ resultado, saldo })
    }
    return results
  }, [sorted])

  const totals = useMemo(() => {
    const totalCreditos = toNumberOrZero(creditTotals?.totalCreditos || 0)
    let totalMovimentos = 0
    for (const it of visibleItems) {
      totalMovimentos += toNumberOrZero(it.valor)
    }
    return { totalCreditos, totalMovimentos, resultado: totalCreditos + totalMovimentos }
  }, [visibleItems, creditTotals])

  return (
    <section className="section">
      <h2 className="section-title">Caixa e Resumo</h2>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">RESULTADO</div>
          <div className="value">R$ {totals.resultado.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Creditos (Entradas Diarias)</div>
          <div className="value">R$ {totals.totalCreditos.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Movimentos</div>
          <div className="value">R$ {totals.totalMovimentos.toFixed(2)}</div>
        </div>
      </div>

      <div className="entries-container">
        <div className="table-wrap">
          <table className="sheet-table ledger-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descricao</th>
                <th>Valor (R$)</th>
                <th className="readonly">Resultado (R$)</th>
                <th className="readonly">Saldo (R$)</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it, idx) => (
                <tr key={it.id}>
                  <td>
                    <input type="date" className="cell-input" value={it.date} onChange={e => updateItem(it.id, 'date', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-input" value={it.descricao} onChange={e => updateItem(it.id, 'descricao', e.target.value)} placeholder="Descricao" />
                  </td>
                  <td>
                    <input type="number" inputMode="decimal" step="any" className="cell-input" value={it.valor || 0} onChange={e => updateItem(it.id, 'valor', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-input readonly" readOnly value={typeof rowResults[idx].resultado === 'number' ? rowResults[idx].resultado.toFixed(2) : ''} />
                  </td>
                  <td>
                    <input className="cell-input readonly" readOnly value={typeof rowResults[idx].saldo === 'number' ? rowResults[idx].saldo.toFixed(2) : ''} />
                  </td>
                  <td className="actions-cell">
                    <button className="link-button danger icon" aria-label="Remover" title="Remover" onClick={() => removeItem(it.id)} disabled={items.length === 1}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-actions">
        <button className="primary" onClick={addItem}>Adicionar Lançamento</button>
      </div>
    </section>
  )
}
