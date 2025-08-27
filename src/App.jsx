import './App.css'
import EntradasDiarias from './components/EntradasDiarias'
import Ledger from './components/Ledger'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Vison Hotel - Resumo de Caixa</h1>
        <div className="subtitle">Planilha interativa simples</div>
      </header>
      <main>
        <EntradasDiarias />
        <Ledger />
      </main>
    </div>
  )
}
