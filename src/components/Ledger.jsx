import { useMemo, useState, useEffect } from 'react'
import { formatDDMM } from '../lib/date.js'

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
    valor: '', // value typed by user; '' renders blank
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
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) return migrateItems(initialItems, activeMonth)
    return []
  })

  // Reset when month or initialItems change (no auto-create)
  useEffect(() => {
    if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
      setItems(migrateItems(initialItems, activeMonth))
    } else {
      setItems([])
    }
  }, [activeMonth, initialItems])

  // Notify parent to persist
  useEffect(() => { onItemsChange && onItemsChange(items) }, [items, onItemsChange])

  const visibleItems = useMemo(() => items.filter(it => (it.date || '').startsWith(activeMonth)), [items, activeMonth])
  const sorted = useMemo(() => [...visibleItems].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [visibleItems])

  const addDisabled = useMemo(() => {
    return visibleItems.some(it => {
      const missingValor = it.valor === '' || it.valor === null || it.valor === undefined || Number.isNaN(Number(it.valor))
      const missingDesc = (typeof it.descricao !== 'string') || it.descricao.trim() === ''
      return missingValor || missingDesc
    })
  }, [visibleItems])

  function addItem() {
    if (addDisabled) return
    const validDates = visibleItems.map(it => it.date).filter(Boolean).sort()
    const nextDate = validDates.length > 0 ? validDates[validDates.length - 1] : `${activeMonth}-01`
    setItems(prev => [...prev, createEmptyItem(nextDate)])
  }

  function removeItem(id) {
    setItems(prev => (prev.length === 1 ? prev : prev.filter(it => it.id !== id)))
  }

  function updateItem(id, field, value) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      if (['date', 'descricao'].includes(field)) return { ...it, [field]: value }
      if (field === 'valor') return { ...it, [field]: value === '' ? '' : toNumberOrZero(value) }
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
    // Lancamentos are debits: subtract from resultado
    return { totalCreditos, totalMovimentos, resultado: totalCreditos - totalMovimentos }
  }, [visibleItems, creditTotals])

  return (
    <section className="section">
      <h2 className="section-title">RESUMO</h2>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">Total Créditos</div>
          <div className="value currency"><span className="prefix">R$</span><span className="val">{totals.totalCreditos.toFixed(2)}</span></div>
        </div>
        <div className="summary-card">
          <div className="label">Total Movimentos</div>
          <div className="value currency"><span className="prefix">R$</span><span className="val">{totals.totalMovimentos.toFixed(2)}</span></div>
        </div>
        <div className="summary-card">
          <div className="label">RESULTADO</div>
          <div className="value currency"><span className="prefix">R$</span><span className="val">{totals.resultado.toFixed(2)}</span></div>
        </div>
      </div>
      <h2 className="section-title entries-title">Lançamentos</h2>

      <div className="entries-container">
        <div className="table-wrap">
          <table className="sheet-table ledger-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor (R$)</th>
                <th className="readonly">Saldo (R$)</th>
                <th className="actions-col" aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it, idx) => (
                <tr key={it.id}>
                  <td>
                    <div className="date-compact-wrap">
                      <input
                        type="date"
                        lang="pt-BR"
                        className="cell-input date-compact"
                        value={it.date}
                        onChange={e => updateItem(it.id, 'date', e.target.value)}
                      />
                      <div className="date-overlay">{formatDDMM(it.date)}</div>
                    </div>
                  </td>
                  <td>
                    <input className="cell-input" value={it.descricao} onChange={e => updateItem(it.id, 'descricao', e.target.value)} placeholder="Descrição" />
                  </td>
                  <td>
                    <div className="currency-input"><span className="prefix">R$</span>
                      <input type="number" inputMode="decimal" step="any" className="cell-input" value={it.valor === '' ? '' : it.valor} onChange={e => updateItem(it.id, 'valor', e.target.value)} />
                    </div>
                  </td>
                  <td>
                    <div className="currency-input"><span className="prefix">R$</span>
                      <input className="cell-input readonly" readOnly value={typeof rowResults[idx].saldo === 'number' ? rowResults[idx].saldo.toFixed(2) : ''} />
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="link-button danger icon" aria-label="Remover" title="Remover" onClick={() => removeItem(it.id)} disabled={items.length === 1}>✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-actions">
        <button className="primary" onClick={addItem} disabled={addDisabled}>Adicionar Lançamento</button>
        {addDisabled && (
          <span className="disabled-hint"><span className="info-icon" aria-hidden>ⓘ</span>Preencha Descrição e Valor em todos os lançamentos para adicionar outro.</span>
        )}
      </div>
    </section>
  )
}
