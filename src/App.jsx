import './App.css'
import { useMemo, useState } from 'react'
import EntradasDiarias from './components/EntradasDiarias'
import Ledger from './components/Ledger'

export default function App() {
  const today = new Date().toISOString().slice(0, 10)
  const [diariasRows, setDiariasRows] = useState([
    {
      id: Math.random().toString(36).slice(2),
      date: today,
      dia: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
      noite: { nEntradas: 0, totalEntradas: 0, cozinha: 0, bar: 0, outros: 0 },
    },
  ])

  const creditTotals = useMemo(() => {
    let totalEntradas = 0
    let totalCozinha = 0
    let totalBar = 0
    let totalOutros = 0
    for (const r of diariasRows) {
      totalEntradas += (r.dia?.totalEntradas || 0) + (r.noite?.totalEntradas || 0)
      totalCozinha += (r.dia?.cozinha || 0) + (r.noite?.cozinha || 0)
      totalBar += (r.dia?.bar || 0) + (r.noite?.bar || 0)
      totalOutros += (r.dia?.outros || 0) + (r.noite?.outros || 0)
    }
    const totalCreditos = totalEntradas + totalCozinha + totalBar + totalOutros
    return { totalEntradas, totalCozinha, totalBar, totalOutros, totalCreditos }
  }, [diariasRows])

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Vison Hotel - Resumo de Caixa</h1>
        <div className="subtitle">Planilha interativa simples</div>
      </header>
      <main>
        <Ledger creditTotals={creditTotals} />
        <EntradasDiarias rows={diariasRows} onChange={setDiariasRows} />
      </main>
    </div>
  )
}
