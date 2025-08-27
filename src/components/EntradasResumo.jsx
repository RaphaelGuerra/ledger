import { useMemo, useState } from 'react'

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function createEmptyMov() {
  return {
    id: Math.random().toString(36).slice(2),
    descricao: '',
    debito: 0,
    credito: 0,
  }
}

function createEmptyDespesa() {
  return {
    id: Math.random().toString(36).slice(2),
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    qtd: 0,
    debito: 0,
  }
}

// EntradasResumo renders two tables: Movimentacao and Despesas.
// - Movimentacao: per-row Resultado = CREDITO - DEBITO; total is the sum of resultados
// - Despesas: per-row value = QTD * DEBITO; Saldo is a running sum; total is the sum of all saldos
export default function EntradasResumo() {
  const [movimentacoes, setMovimentacoes] = useState([createEmptyMov()])
  const [despesas, setDespesas] = useState([createEmptyDespesa()])

  function updateMov(rowId, field, value) {
    setMovimentacoes(prev =>
      prev.map(r => (r.id === rowId ? { ...r, [field]: field === 'descricao' ? value : toNumberOrZero(value) } : r)),
    )
  }

  function updateDesp(rowId, field, value) {
    setDespesas(prev =>
      prev.map(r => {
        if (r.id !== rowId) return r
        if (field === 'data' || field === 'descricao') return { ...r, [field]: value }
        return { ...r, [field]: toNumberOrZero(value) }
      }),
    )
  }

  function addMov() {
    setMovimentacoes(prev => [...prev, createEmptyMov()])
  }

  function removeMov(id) {
    setMovimentacoes(prev => (prev.length === 1 ? prev : prev.filter(r => r.id !== id)))
  }

  function addDesp() {
    setDespesas(prev => [...prev, createEmptyDespesa()])
  }

  function removeDesp(id) {
    setDespesas(prev => (prev.length === 1 ? prev : prev.filter(r => r.id !== id)))
  }

  const movResultados = useMemo(
    () => movimentacoes.map(r => toNumberOrZero(r.credito) - toNumberOrZero(r.debito)),
    [movimentacoes],
  )
  const totalMovimentacao = useMemo(
    () => movResultados.reduce((sum, n) => sum + n, 0),
    [movResultados],
  )

  const despRowValues = useMemo(
    () => despesas.map(r => toNumberOrZero(r.qtd) * toNumberOrZero(r.debito)),
    [despesas],
  )
  const despSaldoRunning = useMemo(() => {
    const out = []
    let acc = 0
    for (const v of despRowValues) {
      acc += v
      out.push(acc)
    }
    return out
  }, [despRowValues])
  const totalDespesas = useMemo(
    () => despSaldoRunning.reduce((sum, n) => sum + n, 0),
    [despSaldoRunning],
  )

  const resultadoTopo = useMemo(
    () => totalMovimentacao + totalDespesas,
    [totalMovimentacao, totalDespesas],
  )

  return (
    <section className="section">
      <h2 className="section-title">ENTRADAS - RESUMO</h2>
      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">RESULTADO</div>
          <div className="value">R$ {resultadoTopo.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Movimentacao</div>
          <div className="value">R$ {totalMovimentacao.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Despesas</div>
          <div className="value">R$ {totalDespesas.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid-two">
        <div>
          <h3 className="sub-title">Movimentacao</h3>
          <div className="table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>DEBITO (R$)</th>
                  <th>CREDITO (R$)</th>
                  <th className="readonly">Resultado (R$)</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        className="cell-input"
                        value={r.descricao}
                        onChange={e => updateMov(r.id, 'descricao', e.target.value)}
                        placeholder="Descricao"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        className="cell-input"
                        value={r.debito}
                        onChange={e => updateMov(r.id, 'debito', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        className="cell-input"
                        value={r.credito}
                        onChange={e => updateMov(r.id, 'credito', e.target.value)}
                      />
                    </td>
                    <td>
                      <input className="cell-input readonly" readOnly value={movResultados[idx].toFixed(2)} />
                    </td>
                    <td>
                      <button className="link-button danger" onClick={() => removeMov(r.id)} disabled={movimentacoes.length === 1}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-actions">
            <button className="primary" onClick={addMov}>Adicionar Linha</button>
          </div>
        </div>

        <div>
          <h3 className="sub-title">Despesas</h3>
          <div className="table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Despesas</th>
                  <th>QTD.</th>
                  <th>DEBITO (R$)</th>
                  <th className="readonly">Saldo (R$)</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <input type="date" className="cell-input" value={r.data} onChange={e => updateDesp(r.id, 'data', e.target.value)} />
                    </td>
                    <td>
                      <input className="cell-input" value={r.descricao} onChange={e => updateDesp(r.id, 'descricao', e.target.value)} placeholder="Descricao" />
                    </td>
                    <td>
                      <input type="number" inputMode="numeric" className="cell-input" value={r.qtd} onChange={e => updateDesp(r.id, 'qtd', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" inputMode="decimal" step="any" className="cell-input" value={r.debito} onChange={e => updateDesp(r.id, 'debito', e.target.value)} />
                    </td>
                    <td>
                      <input className="cell-input readonly" readOnly value={despSaldoRunning[idx].toFixed(2)} />
                    </td>
                    <td>
                      <button className="link-button danger" onClick={() => removeDesp(r.id)} disabled={despesas.length === 1}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-actions">
            <button className="primary" onClick={addDesp}>Adicionar Linha</button>
          </div>
        </div>
      </div>
    </section>
  )
}


