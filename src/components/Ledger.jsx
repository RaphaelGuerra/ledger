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

export default function Ledger({ creditTotals, activeMonth }) {
  const [activeTab, setActiveTab] = useState('all') // all | mov | desp
  const [items, setItems] = useState(() => {
    const initialDate = (activeMonth ? `${activeMonth}-01` : new Date().toISOString().slice(0, 10))
    return [createEmptyMov(initialDate), createEmptyDespesa(initialDate)]
  })
  const [expandedRowId, setExpandedRowId] = useState(null)

  // Ensure each month has at least one mov and one desp entry
  useEffect(() => {
    const monthFirstDay = `${activeMonth}-01`
    
    setItems(prev => {
      // Check if current month has mov and desp entries
      const hasMovForMonth = prev.some(it => it.type === 'mov' && (it.date || '').startsWith(activeMonth))
      const hasDespForMonth = prev.some(it => it.type === 'desp' && (it.date || '').startsWith(activeMonth))
      
      const newItems = []
      
      if (!hasMovForMonth) {
        newItems.push(createEmptyMov(monthFirstDay))
      }
      
      if (!hasDespForMonth) {
        newItems.push(createEmptyDespesa(monthFirstDay))
      }
      
      if (newItems.length > 0) {
        return [...prev, ...newItems]
      }
      return prev
    })
  }, [activeMonth])

  const visibleItems = useMemo(() => {
    return items.filter(it => (it.date || '').startsWith(activeMonth))
  }, [items, activeMonth])

  function addMov() {
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    let nextDate = `${activeMonth}-01`
    if (validDates.length > 0) {
      const lastDate = new Date(validDates[validDates.length - 1])
      lastDate.setDate(lastDate.getDate() + 1)
      nextDate = lastDate.toISOString().slice(0, 10)
    }
    const newItem = createEmptyMov(nextDate)
    setItems(prev => [...prev, newItem])
    setExpandedRowId(newItem.id)
  }
  function addDesp() {
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    let nextDate = `${activeMonth}-01`
    if (validDates.length > 0) {
      const lastDate = new Date(validDates[validDates.length - 1])
      lastDate.setDate(lastDate.getDate() + 1)
      nextDate = lastDate.toISOString().slice(0, 10)
    }
    const newItem = createEmptyDespesa(nextDate)
    setItems(prev => [...prev, newItem])
    setExpandedRowId(newItem.id)
  }
  function removeItem(id) {
    if (expandedRowId === id) setExpandedRowId(null)
    setItems(prev => (prev.length === 1 ? prev : prev.filter(it => it.id !== id)))
  }
  function toggleRowExpansion(id) {
    setExpandedRowId(prev => (prev === id ? null : id))
  }
  function updateItem(id, field, value) {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it
        if (['date', 'descricao', 'type'].includes(field)) return { ...it, [field]: value }
        return { ...it, [field]: toNumberOrZero(value) }
      }),
    )
  }

  const sorted = useMemo(() => {
    return [...visibleItems].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [visibleItems])

  const filtered = useMemo(() => {
    if (activeTab === 'mov') return sorted.filter(it => it.type === 'mov')
    if (activeTab === 'desp') return sorted.filter(it => it.type === 'desp')
    return sorted
  }, [sorted, activeTab])

  const rowResults = useMemo(() => {
    const results = []
    let saldo = 0
    for (const it of filtered) {
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
        const negativeValor = -valor  // Expenses are debits, so negative
        if (valor !== undefined && typeof valor === 'number') saldo += negativeValor
        results.push({ resultado: valor || '', saldo: typeof valor === 'number' ? saldo : '' })
      }
    }
    return results
  }, [filtered])

  const totals = useMemo(() => {
    // Credits come exclusively from Entradas Diarias (passed in via props)
    const totalCreditos = toNumberOrZero(creditTotals?.totalCreditos || 0)
    // Debits from both Movimentacoes and Despesas
    let totalDebitosMovDesp = 0
    for (const it of visibleItems) {
      if (it.type === 'mov') {
        const deb = toNumberOrZero(it.debito)
        // Credits originate from daily entries, so only debits affect the balance here
        totalDebitosMovDesp += deb // only count debits toward final balance subtraction
      } else {
        const qtd = toNumberOrZero(it.qtd)
        const deb = toNumberOrZero(it.debito)
        totalDebitosMovDesp += qtd ? qtd * deb : deb
      }
    }
    return {
      totalCreditos,
      totalDebitos: totalDebitosMovDesp,
      resultado: totalCreditos - totalDebitosMovDesp,
    }
  }, [visibleItems, creditTotals])

  function formatCurrency(value) {
    const n = toNumberOrZero(value)
    return n ? `R$ ${n.toFixed(2)}` : ''
  }

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

      <div className="tabs">
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Tudo</button>
        <button className={`tab ${activeTab === 'mov' ? 'active' : ''}`} onClick={() => setActiveTab('mov')}>Movimentação</button>
        <button className={`tab ${activeTab === 'desp' ? 'active' : ''}`} onClick={() => setActiveTab('desp')}>Despesas</button>
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
              {filtered.map((it, idx) => {
                const isExpanded = expandedRowId === it.id
                return (
                  <>
                    {!isExpanded ? (
                      <tr key={it.id} className={`collapsed-row ${it.type === 'mov' ? 'row-mov' : 'row-desp'}`}>
                        <td>{it.date}</td>
                        <td>
                          <span className={`chip ${it.type === 'mov' ? 'chip-mov' : 'chip-desp'}`}>
                            {it.type === 'mov' ? 'Movimentação' : 'Despesa'}
                          </span>
                        </td>
                        <td>
                          <span className="truncate" title={it.descricao || ''}>{it.descricao || '-'}</span>
                        </td>
                        <td>{it.type === 'desp' ? (it.qtd || '') : '-'}</td>
                        <td>{formatCurrency(it.debito)}</td>
                        <td>{it.type === 'mov' ? formatCurrency(it.credito) : '-'}</td>
                        <td>{typeof rowResults[idx].resultado === 'number' ? rowResults[idx].resultado.toFixed(2) : ''}</td>
                        <td>{typeof rowResults[idx].saldo === 'number' ? rowResults[idx].saldo.toFixed(2) : ''}</td>
                        <td>
                          <button className="link-button primary" onClick={() => toggleRowExpansion(it.id)} aria-expanded="false">Editar</button>
                          <button className="link-button danger" onClick={() => removeItem(it.id)} disabled={items.length === 1} style={{ marginLeft: 8 }}>Remover</button>
                        </td>
                      </tr>
                    ) : (
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
                          <button className="link-button" onClick={() => setExpandedRowId(null)} aria-expanded="true">Fechar</button>
                          <button className="link-button danger" onClick={() => removeItem(it.id)} disabled={items.length === 1} style={{ marginLeft: 8 }}>Remover</button>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
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



