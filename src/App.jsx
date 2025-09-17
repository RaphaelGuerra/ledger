import './App.css'
import { useMemo, useState, useEffect, useRef } from 'react'
import logo from './assets/Gemini_Generated_Image_isbz06isbz06isbz.png'
import EntradasDiarias from './components/EntradasDiarias'
import PrintSheet from './components/PrintSheet'
import Ledger from './components/Ledger'
import { getSyncId, setSyncId, loadLocal, saveLocalDebounced, loadRemote, saveRemoteDebounced } from './lib/store.js'
import { computeCreditTotals, computeAcumulado } from './lib/stats.js'
import { getMonthDisplayName, incMonth } from './lib/date.js'

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

  const creditTotals = useMemo(() => computeCreditTotals(visibleDiariasRows), [visibleDiariasRows])

  const acumulado = useMemo(() => computeAcumulado(visibleDiariasRows), [visibleDiariasRows])

  function navigateMonth(direction) {
    setActiveMonth(prev => incMonth(prev, direction))
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner header-grid">
          <div className="brand">
            <img src={logo} alt="Logo" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-title">Vison Hotel</div>
              <div className="brand-subtitle">Resumo de Caixa</div>
            </div>
          </div>
          <div className="header-month-controls">
            <div className="month-navigation">
              <button className="month-nav-btn" onClick={() => navigateMonth(-1)} aria-label="Mês anterior" title="Mês anterior">←</button>
              <span className="current-month">{getMonthDisplayName(activeMonth)}</span>
              <button className="month-nav-btn" onClick={() => navigateMonth(1)} aria-label="Próximo mês" title="Próximo mês">→</button>
            </div>
            <div className="month-actions">
              <button
                className="secondary print-btn"
                onClick={() => {
                  const onAfterPrint = () => {
                    setPrintMode(false)
                    window.removeEventListener('afterprint', onAfterPrint)
                  }
                  window.addEventListener('afterprint', onAfterPrint)
                  setPrintMode(true)
                  setTimeout(() => window.print(), 0)
                }}
              >
                Imprimir
              </button>
            </div>
          </div>
          <div className="sync-group">
            <div className="sync-id-row">
              <div className="sync-id-label">
                <label className="sync-label" htmlFor="sync-id">ID</label>
                <span
                  className={
                    !syncId ? 'sync-dot off' : (
                      syncStatus === 'ok' ? 'sync-dot ok' : (syncStatus === 'loading' ? 'sync-dot loading' : 'sync-dot error')
                    )
                  }
                  aria-label={!syncId ? 'Sync desligado' : (syncStatus === 'ok' ? 'Sync OK' : (syncStatus === 'loading' ? 'Sincronizando' : 'Sync erro'))}
                  title={!syncId ? 'Sync desligado' : (syncStatus === 'ok' ? 'Sync OK' : (syncStatus === 'loading' ? 'Sincronizando' : 'Sync erro'))}
                />
              </div>
              <input
                id="sync-id"
                className="cell-input sync-input"
                placeholder="opcional"
                value={syncIdDraft}
                onChange={e => handleSyncIdChange(e.target.value.trim())}
              />
              <div className="sync-actions-inline">
                {syncId ? (
                  <button
                    className="secondary icon-btn"
                    onClick={disconnectSync}
                    aria-label="Desconectar sync"
                    title="Desconectar"
                  >
                    ⎋
                  </button>
                ) : (
                  <button
                    className="secondary icon-btn"
                    onClick={connectSync}
                    disabled={!syncIdDraft}
                    aria-label="Conectar sync"
                    title="Conectar"
                  >
                    ⏎
                  </button>
                )}
              </div>
            </div>
            {/* Print button moved under month selector for all viewports */}
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
