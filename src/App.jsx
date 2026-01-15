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
import { filterByMonth, visibleEntradasRows, visibleLedgerItems } from './lib/selectors.js'
import { buildMonthExport, validateMonthImport } from './lib/transfer.js'
import { fmt2 } from './lib/number.js'

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
  const [importOpen, setImportOpen] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importSummary, setImportSummary] = useState(null)
  const [importErrors, setImportErrors] = useState([])
  const [importWarnings, setImportWarnings] = useState([])
  const [importPayload, setImportPayload] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef(null)
  const lastSyncStatusRef = useRef('off')
  const printRequestedRef = useRef(false)

  function showToast(msg) {
    setToastMsg(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2000)
  }

  function downloadJSON(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
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
  function persistMonthData(month, data) {
    saveLocalDebounced(month, data)
    if (syncId) {
      saveRemoteDebounced(syncId, month, data, ok => {
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
  }

  function persist(partial) {
    const payload = {
      entradasRows: partial.entradasRows ?? diariasRows,
      ledgerItems: partial.ledgerItems ?? null,
    }
    persistMonthData(activeMonth, payload)
  }

  // Do not auto-create rows when month changes; users add explicitly

  const visibleDiariasRows = useMemo(() => filterByMonth(diariasRows, activeMonth), [diariasRows, activeMonth])

  const creditTotals = useMemo(() => computeCreditTotals(visibleDiariasRows), [visibleDiariasRows])

  const acumulado = useMemo(() => computeAcumulado(visibleDiariasRows), [visibleDiariasRows])

  const importReady = Boolean(importPayload && importErrors.length === 0 && syncStatus !== 'loading')
  const importMonthLabel = importSummary?.month ? getMonthDisplayName(importSummary.month) : ''
  const importCreatedAtLabel = importSummary?.createdAt && !Number.isNaN(Date.parse(importSummary.createdAt))
    ? new Date(importSummary.createdAt).toLocaleString('pt-BR')
    : ''

  function navigateMonth(direction) {
    setActiveMonth(prev => incMonth(prev, direction))
  }

  function handlePrint() {
    printRequestedRef.current = true
    setPrintMode(true)
  }

  function handleExport() {
    const entradasExport = visibleEntradasRows(diariasRows, activeMonth)
    const ledgerSource = Array.isArray(ledgerItems) ? ledgerItems : (Array.isArray(ledgerInitialItems) ? ledgerInitialItems : [])
    const ledgerExport = visibleLedgerItems(ledgerSource, activeMonth)
    const payload = buildMonthExport({
      month: activeMonth,
      entradasRows: entradasExport,
      ledgerItems: ledgerExport,
    })
    downloadJSON(payload, `cash-ledger-${activeMonth}.json`)
    showToast('Exportação pronta')
  }

  function openImport() {
    setImportOpen(true)
    setImportFileName('')
    setImportSummary(null)
    setImportErrors([])
    setImportWarnings([])
    setImportPayload(null)
  }

  function closeImport() {
    setImportOpen(false)
    setImportFileName('')
    setImportSummary(null)
    setImportErrors([])
    setImportWarnings([])
    setImportPayload(null)
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    setImportErrors([])
    setImportWarnings([])
    setImportSummary(null)
    setImportPayload(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const result = validateMonthImport(parsed, activeMonth)
      setImportSummary(result.summary)
      setImportErrors(result.errors)
      setImportWarnings(result.warnings)
      setImportPayload(result.payload)
    } catch {
      setImportErrors(['Não foi possível ler o JSON do arquivo.'])
    }
  }

  function confirmImport() {
    if (!importPayload || importErrors.length > 0) return
    const targetMonth = importPayload.month || activeMonth
    const data = {
      entradasRows: importPayload.entradasRows || [],
      ledgerItems: importPayload.ledgerItems || [],
    }
    setDiariasRows(data.entradasRows)
    setLedgerInitialItems(data.ledgerItems)
    setLedgerItems(data.ledgerItems)
    persistMonthData(targetMonth, data)
    showToast('Importação concluída')
    closeImport()
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
        onExport={handleExport}
        onImport={openImport}
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
              <div className="value currency"><span className="prefix">R$</span><span className="val">{fmt2(acumulado.total.entradas || 0)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Média</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{fmt2(acumulado.total.media)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Cozinha</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{fmt2(acumulado.total.cozinha || 0)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Bar</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{fmt2(acumulado.total.bar || 0)}</span></div>
            </div>
            <div className="summary-card">
              <div className="label">Outros</div>
              <div className="value currency"><span className="prefix">R$</span><span className="val">{fmt2(acumulado.total.outros || 0)}</span></div>
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
      {importOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Importar mês">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Importar mês</h3>
                <p className="modal-subtitle">Use um arquivo JSON exportado pelo Cash Ledger.</p>
              </div>
              <button className="link-button danger" onClick={closeImport} aria-label="Fechar">
                Fechar
              </button>
            </div>

            <label className="file-drop">
              <input type="file" accept="application/json" onChange={handleImportFile} />
              <span>{importFileName ? `Arquivo: ${importFileName}` : 'Selecionar arquivo JSON'}</span>
            </label>

            {importSummary && (
              <div className="import-summary">
                <div className="import-row">
                  <span>Mês</span>
                  <span>{importMonthLabel ? `${importMonthLabel} (${importSummary.month})` : importSummary.month}</span>
                </div>
                <div className="import-row">
                  <span>Entradas</span>
                  <span>{importSummary.entradasCount}</span>
                </div>
                <div className="import-row">
                  <span>Lançamentos</span>
                  <span>{importSummary.ledgerCount}</span>
                </div>
                {importCreatedAtLabel ? (
                  <div className="import-row">
                    <span>Criado em</span>
                    <span>{importCreatedAtLabel}</span>
                  </div>
                ) : null}
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="import-callout error">
                <div className="callout-title">Erros</div>
                <ul>
                  {importErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            {importWarnings.length > 0 && (
              <div className="import-callout warning">
                <div className="callout-title">Avisos</div>
                <ul>
                  {importWarnings.map((warn, idx) => <li key={idx}>{warn}</li>)}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary" onClick={closeImport}>
                Cancelar
              </button>
              <button className="primary" onClick={confirmImport} disabled={!importReady}>
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMsg ? <div className="toast" role="status" aria-live="polite">{toastMsg}</div> : null}
    </div>
  )
}
