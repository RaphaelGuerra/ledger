import './App.css'
import { useMemo, useState, useEffect, useRef } from 'react'
import logo from './assets/Gemini_Generated_Image_isbz06isbz06isbz.png'
import EntradasDiarias from './components/EntradasDiarias'
import PrintSheet from './components/PrintSheet'
import Ledger from './components/Ledger'
import { getSyncId, setSyncId, loadLocal, saveLocalDebounced, loadRemote, saveRemoteDebounced } from './lib/store.js'

export default function App() {
  // Get first day of current month for initial record
  const now = new Date()
  const firstDayOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10)
  const [activeMonth, setActiveMonth] = useState(firstDayOfMonth.slice(0, 7)) // YYYY-MM
  const [syncId, setSyncIdState] = useState('') // active (connected) ID
  const [syncIdDraft, setSyncIdDraft] = useState('') // user input (not yet connected)
  const [syncStatus, setSyncStatus] = useState('off') // off | loading | ok | error
  
  const [diariasRows, setDiariasRows] = useState([])
  const [ledgerInitialItems, setLedgerInitialItems] = useState(null)
  const [ledgerItems, setLedgerItems] = useState(null)
  const [printMode, setPrintMode] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef(null)
  const lastSyncStatusRef = useRef('off')

  function showToast(msg) {
    setToastMsg(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2000)
  }

  // Sync ID init
  useEffect(() => {
    const id = getSyncId()
    setSyncIdState(id)
    setSyncIdDraft(id)
  }, [])

  function handleSyncIdChange(id) {
    setSyncIdDraft(id)
  }

  function connectSync() {
    const id = (syncIdDraft || '').trim()
    setSyncIdState(id)
    setSyncId(id)
    setSyncStatus(id ? 'loading' : 'off')
    if (id) showToast('Sync conectado')
    lastSyncStatusRef.current = id ? 'loading' : 'off'
  }

  function disconnectSync() {
    setSyncIdState('')
    setSyncId('')
    setSyncStatus('off')
    showToast('Sync desconectado')
    lastSyncStatusRef.current = 'off'
  }

  // Load month data (remote first if syncId, then local)
  useEffect(() => {
    let cancelled = false
    // Immediately clear current month views to avoid flicker/ghost rows
    setDiariasRows([])
    setLedgerInitialItems(null)
    setLedgerItems(null)
    async function load() {
      let data = null
      if (syncId) {
        setSyncStatus('loading')
        const res = await loadRemote(syncId, activeMonth)
        if (res.ok) {
          setSyncStatus('ok')
          lastSyncStatusRef.current = 'ok'
          data = res.data
          showToast('Sync carregado')
        } else {
          setSyncStatus('error')
          lastSyncStatusRef.current = 'error'
          showToast('Falha de sync')
        }
      }
      if (!data) data = loadLocal(activeMonth)
      if (cancelled) return
      if (data?.entradasRows) setDiariasRows(data.entradasRows)
      if (data?.ledgerItems) setLedgerInitialItems(data.ledgerItems)
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
    if (syncId) saveRemoteDebounced(syncId, activeMonth, payload, ok => {
      setSyncStatus(ok ? 'ok' : 'error')
      if (!ok) {
        lastSyncStatusRef.current = 'error'
        showToast('Falha de sync')
      } else {
        if (lastSyncStatusRef.current !== 'ok') showToast('Sync atualizado')
        lastSyncStatusRef.current = 'ok'
      }
    })
  }

  // Do not auto-create rows when month changes; users add explicitly

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
    const [y, m] = monthStr.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, 1))
    const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  useEffect(() => {
    function handleAfterPrint() { setPrintMode(false) }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

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
          <div className="sync-group" style={{ display: 'inline-flex', gap: 8, alignItems: 'flex-start', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', flex: '1 1 auto' }}>
                ID
                <input
                  style={{ marginLeft: 8, width: '100%' }}
                  className="cell-input"
                  placeholder="opcional"
                  value={syncIdDraft}
                  onChange={e => handleSyncIdChange(e.target.value.trim())}
                />
              </label>
              <button className="secondary" onClick={() => { setPrintMode(true); setTimeout(() => window.print(), 0) }}>Imprimir</button>
            </div>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              {syncId ? (
                <button className="secondary" onClick={disconnectSync}>Desconectar</button>
              ) : (
                <button className="secondary" onClick={connectSync} disabled={!syncIdDraft}>Conectar</button>
              )}
              <div className="sync-status">
                {syncId ? (
                  syncStatus === 'ok' ? (
                    <span className="sync-ok"><span className="sync-dot">●</span> Sync OK</span>
                  ) : syncStatus === 'error' ? (
                    <span className="sync-err"><span className="sync-dot">●</span> Sync erro</span>
                  ) : (
                    <span className="sync-loading"><span className="sync-dot">●</span> Sincronizando…</span>
                  )
                ) : (
                  <span className="sync-off"><span className="sync-dot">●</span> Sync desligado</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <Ledger
          creditTotals={creditTotals}
          activeMonth={activeMonth}
          initialItems={ledgerInitialItems}
          onItemsChange={items => { setLedgerItems(items); persist({ ledgerItems: items }) }}
        />
        <section className="section acumulado-section">
          <h2 className="section-title">Acumulado</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="label">Entradas</div>
              <div className="value">{acumulado.total.n || 0}</div>
            </div>
            <div className="summary-card">
              <div className="label">Diárias</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{(acumulado.total.entradas || 0).toFixed(2)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Média</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{typeof acumulado.total.media === 'number' ? acumulado.total.media.toFixed(2) : ''}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Cozinha</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{(acumulado.total.cozinha || 0).toFixed(2)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Bar</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{(acumulado.total.bar || 0).toFixed(2)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Outros</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{(acumulado.total.outros || 0).toFixed(2)}</span></div>
            </div>
          </div>
        </section>
        <EntradasDiarias
          rows={diariasRows}
          onChange={(rows) => { setDiariasRows(rows); persist({ entradasRows: rows }) }}
          activeMonth={activeMonth}
        />
      </main>
      {printMode && (
        <PrintSheet
          hotelName="Vison Hotel"
          logoSrc={logo}
          monthDisplay={getMonthDisplayName(activeMonth)}
          syncId={syncId}
          creditTotals={creditTotals}
          acumulado={acumulado}
          ledgerItems={ledgerItems}
          entradasRows={diariasRows}
          activeMonth={activeMonth}
        />
      )}
      {toastMsg ? <div className="toast" role="status" aria-live="polite">{toastMsg}</div> : null}
    </div>
  )
}
