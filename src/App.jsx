import './App.css'
import { useMemo, useState, useEffect } from 'react'
import logo from './assets/Gemini_Generated_Image_isbz06isbz06isbz.png'
import EntradasDiarias from './components/EntradasDiarias'
import Ledger from './components/Ledger'

export default function App() {
  // Get first day of current month for initial record
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const [activeMonth, setActiveMonth] = useState(firstDayOfMonth.slice(0, 7)) // YYYY-MM
  
  const [diariasRows, setDiariasRows] = useState([
    {
      id: Math.random().toString(36).slice(2),
      date: firstDayOfMonth,
      dia: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
      noite: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
    },
  ])

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
            <button className="month-nav-btn" onClick={() => navigateMonth(-1)} aria-label="Mês anterior">
              ←
            </button>
            <span className="current-month">{getMonthDisplayName(activeMonth)}</span>
            <button className="month-nav-btn" onClick={() => navigateMonth(1)} aria-label="Próximo mês">
              →
            </button>
          </div>
        </div>
      </header>
      <main>
        <Ledger creditTotals={creditTotals} activeMonth={activeMonth} />
        <EntradasDiarias rows={diariasRows} onChange={setDiariasRows} activeMonth={activeMonth} />
      </main>
    </div>
  )
}
