import './App.css'
import { useMemo, useState, useEffect, useRef } from 'react'
import logo from './assets/logo.webp'
import EntradasDiarias from './components/EntradasDiarias'
import PrintSheet from './components/PrintSheet'
import Ledger from './components/Ledger'
import Header from './components/Header'
import { getSyncId, setSyncId, loadLocal, saveLocalDebounced, loadRemote, saveRemoteDebounced } from './lib/store.js'
import { computeCreditTotals, computeAcumulado } from './lib/stats.js'
import { getMonthDisplayName, incMonth } from './lib/date.js'
import { filterByMonth } from './lib/selectors.js'

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
  const printRequestedRef = useRef(false)

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
    // Success toast shown after first successful load/save.
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
          showToast('Sync conectado')
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

  const visibleDiariasRows = useMemo(() => filterByMonth(diariasRows, activeMonth), [diariasRows, activeMonth])

  const creditTotals = useMemo(() => computeCreditTotals(visibleDiariasRows), [visibleDiariasRows])

  const acumulado = useMemo(() => computeAcumulado(visibleDiariasRows), [visibleDiariasRows])

  function navigateMonth(direction) {
    setActiveMonth(prev => incMonth(prev, direction))
  }

  function handlePrint() {
    printRequestedRef.current = true
    setPrintMode(true)
  }

  useEffect(() => {
    if (!printMode || typeof window === 'undefined') return undefined

    let raf1 = null
    let raf2 = null

    const onAfterPrint = () => {
      printRequestedRef.current = false
      setPrintMode(false)
    }

    window.addEventListener('afterprint', onAfterPrint)

    if (printRequestedRef.current) {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          window.print()
        })
      })
    }

    return () => {
      if (raf1) cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [printMode])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onBeforePrint = () => {
      setPrintMode(true)
    }
    window.addEventListener('beforeprint', onBeforePrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
    }
  }, [])

  return (
    <div className="app-root">
      <Header
        logoSrc={logo}
        brandTitle="Vison Hotel"
        brandSubtitle="Resumo de Caixa"
        monthLabel={getMonthDisplayName(activeMonth)}
        onPrevMonth={() => navigateMonth(-1)}
        onNextMonth={() => navigateMonth(1)}
        onPrint={handlePrint}
        syncId={syncId}
        syncIdDraft={syncIdDraft}
        syncStatus={syncStatus}
        onSyncIdChange={handleSyncIdChange}
        onConnect={connectSync}
        onDisconnect={disconnectSync}
      />
      <main>
        <Ledger
          creditTotals={creditTotals}
          activeMonth={activeMonth}
          initialItems={ledgerInitialItems}
          onItemsChange={items => { setLedgerItems(items); persist({ ledgerItems: items }) }}
          canCreate={syncStatus !== 'loading'}
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
          canCreate={syncStatus !== 'loading'}
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
