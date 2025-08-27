import './App.css'
import EntradasDiarias from './components/EntradasDiarias'
import EntradasResumo from './components/EntradasResumo'
import Caixa from './components/Caixa'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Vison Hotel - Resumo de Caixa</h1>
        <div className="subtitle">Planilha interativa simples</div>
      </header>
      <main>
        <EntradasDiarias />
        <EntradasResumo />
        <Caixa />
      </main>
    </div>
  )
}
