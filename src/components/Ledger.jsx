import { useMemo, useState, useEffect } from 'react'

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function createEmptyMov(defaultDate) {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'mov',
    date: defaultDate || new Date().toISOString().slice(0, 10),
    descricao: '',
    debito: 0,
    credito: 0,
  }
}

function createEmptyDespesa(defaultDate) {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'desp',
    date: defaultDate || new Date().toISOString().slice(0, 10),
    descricao: '',
    qtd: 0,
    debito: 0,
  }
}

export default function Ledger({ creditTotals, activeMonth, initialItems, onItemsChange }) {
  const [items, setItems] = useState(() => {
    const initialDate = (activeMonth ? `${activeMonth}-01` : new Date().toISOString().slice(0, 10))
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) return initialItems
    return [createEmptyMov(initialDate), createEmptyDespesa(initialDate)]
  })

  // Reset when month or initialItems change
  useEffect(() => {
    const first = `${activeMonth}-01`
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
      setItems(initialItems)
    } else {
      setItems([createEmptyMov(first), createEmptyDespesa(first)])
    }
  }, [activeMonth, initialItems])

  // Ensure at least one mov and one desp item for the month
  useEffect(() => {
    const monthFirstDay = `${activeMonth}-01`
    setItems(prev => {
      const hasMov = prev.some(it => it.type === 'mov' && (it.date || '').startsWith(activeMonth))
      const hasDesp = prev.some(it => it.type === 'desp' && (it.date || '').startsWith(activeMonth))
      const add = []
      if (!hasMov) add.push(createEmptyMov(monthFirstDay))
      if (!hasDesp) add.push(createEmptyDespesa(monthFirstDay))
      return add.length ? [...prev, ...add] : prev
    })
  }, [activeMonth])

  // Notify parent to persist
  useEffect(() => { onItemsChange && onItemsChange(items) }, [items, onItemsChange])

  const visibleItems = useMemo(() => items.filter(it => (it.date || '').startsWith(activeMonth)), [items, activeMonth])
  const sorted = useMemo(() => [...visibleItems].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [visibleItems])

  function addMov() {
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    let nextDate = `${activeMonth}-01`
    if (validDates.length > 0) {
      const lastDate = new Date(validDates[validDates.length - 1])
      lastDate.setDate(lastDate.getDate() + 1)
      nextDate = lastDate.toISOString().slice(0, 10)
    }
    setItems(prev => [...prev, createEmptyMov(nextDate)])
  }

  function addDesp() {
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    let nextDate = `${activeMonth}-01`
    if (validDates.length > 0) {
      const lastDate = new Date(validDates[validDates.length - 1])
      lastDate.setDate(lastDate.getDate() + 1)
      nextDate = lastDate.toISOString().slice(0, 10)
    }
    setItems(prev => [...prev, createEmptyDespesa(nextDate)])
  }

  function removeItem(id) {
    setItems(prev => (prev.length === 1 ? prev : prev.filter(it => it.id !== id)))
  }

  function updateItem(id, field, value) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      if (['date', 'descricao', 'type'].includes(field)) return { ...it, [field]: value }
      return { ...it, [field]: toNumberOrZero(value) }
    }))
  }

  const rowResults = useMemo(() => {
    const results = []
    let saldo = 0
    for (const it of sorted) {
      if (it.type === 'mov') {
        const hasDeb = it.debito !== '' && it.debito !== null && it.debito !== undefined && !Number.isNaN(Number(it.debito))
        const hasCre = it.credito !== '' && it.credito !== null && it.credito !== undefined && !Number.isNaN(Number(it.credito))
        const deb = toNumberOrZero(it.debito)
        const cre = toNumberOrZero(it.credito)
        const resultado = hasDeb && hasCre ? cre - deb : hasDeb ? -deb : hasCre ? cre : ''
        if (typeof resultado === 'number') saldo += resultado
        results.push({ resultado, saldo })
      } else {
        const qtd = toNumberOrZero(it.qtd)
        const deb = toNumberOrZero(it.debito)
        const valor = qtd ? qtd * deb : deb
        const negativeValor = -valor
        if (valor !== undefined && typeof valor === 'number') saldo += negativeValor
        results.push({ resultado: valor || '', saldo: typeof valor === 'number' ? saldo : '' })
      }
    }
    return results
  }, [sorted])

  const totals = useMemo(() => {
    const totalCreditos = toNumberOrZero(creditTotals?.totalCreditos || 0)
    let totalDebitos = 0
    for (const it of visibleItems) {
      if (it.type === 'mov') {
        totalDebitos += toNumberOrZero(it.debito)
      } else {
        const qtd = toNumberOrZero(it.qtd)
        const deb = toNumberOrZero(it.debito)
        totalDebitos += qtd ? qtd * deb : deb
      }
    }
    return { totalCreditos, totalDebitos, resultado: totalCreditos - totalDebitos }
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
          <div className="label">Total Debitos (Mov + Desp)</div>
          <div className="value">R$ {totals.totalDebitos.toFixed(2)}</div>
        </div>
      </div>

      <div className="entries-container">
        <div className="table-wrap">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>QTD.</th>
                <th>Debito (R$)</th>
                <th>Credito (R$)</th>
                <th className="readonly">Resultado (R$)</th>
                <th className="readonly">Saldo (R$)</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it, idx) => (
                <tr key={it.id} className={it.type === 'mov' ? 'row-mov' : 'row-desp'}>
                  <td>
                    <input type="date" className="cell-input" value={it.date} onChange={e => updateItem(it.id, 'date', e.target.value)} />
                  </td>
                  <td>
                    <select className="cell-input" value={it.type} onChange={e => updateItem(it.id, 'type', e.target.value)}>
                      <option value="mov">Movimentação</option>
                      <option value="desp">Despesa</option>
                    </select>
                  </td>
                  <td>
                    <input className="cell-input" value={it.descricao} onChange={e => updateItem(it.id, 'descricao', e.target.value)} placeholder="Descricao" />
                  </td>
                  <td>
                    {it.type === 'desp' ? (
                      <input type="number" inputMode="numeric" className="cell-input" value={it.qtd || 0} onChange={e => updateItem(it.id, 'qtd', e.target.value)} />
                    ) : (
                      <input className="cell-input readonly" readOnly value="-" />
                    )}
                  </td>
                  <td>
                    <input type="number" inputMode="decimal" step="any" className="cell-input" value={it.debito || 0} onChange={e => updateItem(it.id, 'debito', e.target.value)} />
                  </td>
                  <td>
                    {it.type === 'mov' ? (
                      <input type="number" inputMode="decimal" step="any" className="cell-input" value={it.credito || 0} onChange={e => updateItem(it.id, 'credito', e.target.value)} />
                    ) : (
                      <input className="cell-input readonly" readOnly value="-" />
                    )}
                  </td>
                  <td>
                    <input className="cell-input readonly" readOnly value={typeof rowResults[idx].resultado === 'number' ? rowResults[idx].resultado.toFixed(2) : ''} />
                  </td>
                  <td>
                    <input className="cell-input readonly" readOnly value={typeof rowResults[idx].saldo === 'number' ? rowResults[idx].saldo.toFixed(2) : ''} />
                  </td>
                  <td>
                    <button className="link-button danger" onClick={() => removeItem(it.id)} disabled={items.length === 1}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-actions">
        <button className="primary" onClick={addMov}>Adicionar Movimentação</button>
        <button className="primary" style={{ marginLeft: 8 }} onClick={addDesp}>Adicionar Despesa</button>
      </div>
    </section>
  )
}

