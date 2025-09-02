import './App.css'
import { useMemo, useState, useEffect } from 'react'
import logo from './assets/Gemini_Generated_Image_isbz06isbz06isbz.png'
import EntradasDiarias from './components/EntradasDiarias'
import Ledger from './components/Ledger'
import { getSyncId, setSyncId, loadLocal, saveLocalDebounced, loadRemote, saveRemoteDebounced } from './lib/store.js'

export default function App() {
  // Get first day of current month for initial record
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const [activeMonth, setActiveMonth] = useState(firstDayOfMonth.slice(0, 7)) // YYYY-MM
  const [syncId, setSyncIdState] = useState('')
  
  const [diariasRows, setDiariasRows] = useState([
    {
      id: Math.random().toString(36).slice(2),
      date: firstDayOfMonth,
      dia: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
      noite: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
    },
  ])
  const [ledgerInitialItems, setLedgerInitialItems] = useState(null)

  // Sync ID init
  useEffect(() => {
    setSyncIdState(getSyncId())
  }, [])

  function handleSyncIdChange(id) {
    setSyncIdState(id)
    setSyncId(id)
  }

  // Load month data (remote first if syncId, then local)
  useEffect(() => {
    let cancelled = false
    async function load() {
      let data = null
      if (syncId) data = await loadRemote(syncId, activeMonth)
      if (!data) data = loadLocal(activeMonth)
      if (cancelled) return
      if (data?.entradasRows) setDiariasRows(data.entradasRows)
      if (data?.ledgerItems) setLedgerInitialItems(data.ledgerItems)
      if (!data) {
        setLedgerInitialItems(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeMonth, syncId])

  // Persist helpers
  function persist(partial) {
    const payload = {
      entradasRows: partial.entradasRows ?? diariasRows,
      ledgerItems: partial.ledgerItems ?? null,
    }
    saveLocalDebounced(activeMonth, payload)
    if (syncId) saveRemoteDebounced(syncId, activeMonth, payload)
  }

  // Ensure each month has at least one entry of each type
  useEffect(() => {
    const monthFirstDay = `${activeMonth}-01`
    
    setDiariasRows(prev => {
      // Check if current month has any diarias entries
      const hasEntradasForMonth = prev.some(r => (r.date || '').startsWith(activeMonth))
      
      if (!hasEntradasForMonth) {
        // Add a default entrada for this month
        const newEntry = {
          id: Math.random().toString(36).slice(2),
          date: monthFirstDay,
          dia: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
          noite: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
        }
        return [...prev, newEntry]
      }
      return prev
    })
  }, [activeMonth])

  const visibleDiariasRows = useMemo(() => {
    return diariasRows.filter(r => (r.date || '').startsWith(activeMonth))
  }, [diariasRows, activeMonth])

  const creditTotals = useMemo(() => {
    let totalEntradas = 0
    let totalCozinha = 0
    let totalBar = 0
    let totalOutros = 0
    for (const r of visibleDiariasRows) {
      totalEntradas += (r.dia?.totalEntradas || 0) + (r.noite?.totalEntradas || 0)
      totalCozinha += (r.dia?.cozinha || 0) + (r.noite?.cozinha || 0)
      totalBar += (r.dia?.bar || 0) + (r.noite?.bar || 0)
      totalOutros += (r.dia?.outros || 0) + (r.noite?.outros || 0)
    }
    const totalCreditos = totalEntradas + totalCozinha + totalBar + totalOutros
    return { totalEntradas, totalCozinha, totalBar, totalOutros, totalCreditos }
  }, [visibleDiariasRows])

  const acumulado = useMemo(() => {
    let diaN = 0, diaTot = 0, diaC = 0, diaB = 0, diaO = 0
    let noiN = 0, noiTot = 0, noiC = 0, noiB = 0, noiO = 0
    for (const r of visibleDiariasRows) {
      diaN += r.dia?.nEntradas || 0
      diaTot += r.dia?.totalEntradas || 0
      diaC += r.dia?.cozinha || 0
      diaB += r.dia?.bar || 0
      diaO += r.dia?.outros || 0

      noiN += r.noite?.nEntradas || 0
      noiTot += r.noite?.totalEntradas || 0
      noiC += r.noite?.cozinha || 0
      noiB += r.noite?.bar || 0
      noiO += r.noite?.outros || 0
    }
    const totN = diaN + noiN
    const totTot = diaTot + noiTot
    const totC = diaC + noiC
    const totB = diaB + noiB
    const totO = diaO + noiO
    const mediaDia = diaN > 0 ? diaTot / diaN : ''
    const mediaNoite = noiN > 0 ? noiTot / noiN : ''
    const mediaTot = totN > 0 ? totTot / totN : ''
    return {
      dia: { n: diaN, entradas: diaTot, cozinha: diaC, bar: diaB, outros: diaO, media: mediaDia },
      noite: { n: noiN, entradas: noiTot, cozinha: noiC, bar: noiB, outros: noiO, media: mediaNoite },
      total: { n: totN, entradas: totTot, cozinha: totC, bar: totB, outros: totO, media: mediaTot },
    }
  }, [visibleDiariasRows])

  function getMonthDisplayName(monthStr) {
    const date = new Date(monthStr + '-01')
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  function navigateMonth(direction) {
    const [year, month] = activeMonth.split('-').map(Number)
    let newYear = year
    let newMonth = month + direction
    
    // Handle year overflow/underflow
    while (newMonth > 12) {
      newMonth -= 12
      newYear += 1
    }
    while (newMonth < 1) {
      newMonth += 12
      newYear -= 1
    }
    
    const newActiveMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`
    setActiveMonth(newActiveMonth)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <img src={logo} alt="Logo" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-title">Vison Hotel</div>
              <div className="brand-subtitle">Resumo de Caixa</div>
            </div>
          </div>
          <div className="month-navigation header-month-controls">
            <button className="month-nav-btn" onClick={() => navigateMonth(-1)} aria-label="Mês anterior" title="Mês anterior">
              ←
            </button>
            <span className="current-month">{getMonthDisplayName(activeMonth)}</span>
            <button className="month-nav-btn" onClick={() => navigateMonth(1)} aria-label="Próximo mês" title="Próximo mês">
              →
            </button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>
              Sync ID
              <input
                style={{ marginLeft: 8 }}
                className="cell-input"
                placeholder="opcional"
                value={syncId}
                onChange={e => handleSyncIdChange(e.target.value.trim())}
              />
            </label>
          </div>
        </div>
      </header>
      <main>
        <section className="section entradas-section">
          <h2 className="section-title">Acumulado</h2>
          <div className="table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th></th>
                  <th>N</th>
                  <th>Entradas</th>
                  <th>Cozinha</th>
                  <th>Bar</th>
                  <th>Outros</th>
                  <th>Média</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="shift-label">Dia</td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.n || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.entradas || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.cozinha || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.bar || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.outros || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.dia.media || ''} /></td>
                </tr>
                <tr>
                  <td className="shift-label">Noite</td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.n || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.entradas || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.cozinha || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.bar || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.outros || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.noite.media || ''} /></td>
                </tr>
                <tr className="subtotal-row">
                  <td className="shift-label">Total</td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.n || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.entradas || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.cozinha || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.bar || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.outros || ''} /></td>
                  <td><input className="cell-input readonly" readOnly value={acumulado.total.media || ''} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <Ledger
          creditTotals={creditTotals}
          activeMonth={activeMonth}
          initialItems={ledgerInitialItems}
          onItemsChange={items => persist({ ledgerItems: items })}
        />
        <EntradasDiarias
          rows={diariasRows}
          onChange={(rows) => { setDiariasRows(rows); persist({ entradasRows: rows }) }}
          activeMonth={activeMonth}
        />
      </main>
    </div>
  )
}
