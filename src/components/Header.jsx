/**
 * Top-level app header containing brand, month navigation, and sync controls.
 * Split into smaller pieces so App.jsx stays focused on state/data wiring.
 */
/**
 * @param {Object} props
 * @param {string} props.logoSrc
 * @param {string} props.brandTitle
 * @param {string} props.brandSubtitle
 * @param {string} props.monthLabel
 * @param {() => void} props.onPrevMonth
 * @param {() => void} props.onNextMonth
 * @param {() => void} props.onPrint
 * @param {string} props.syncId
 * @param {string} props.syncIdDraft
 * @param {'off' | 'loading' | 'ok' | 'error'} props.syncStatus
 * @param {(value: string) => void} props.onSyncIdChange
 * @param {() => void} props.onConnect
 * @param {() => void} props.onDisconnect
 */
export default function Header({
  logoSrc,
  brandTitle,
  brandSubtitle,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onPrint,
  syncId,
  syncIdDraft,
  syncStatus,
  onSyncIdChange,
  onConnect,
  onDisconnect,
}) {
  return (
    <header className="app-header">
      <div className="app-header-inner header-grid">
        <div className="brand">
          <img src={logoSrc} alt="Logo" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-title">{brandTitle}</div>
            <div className="brand-subtitle">{brandSubtitle}</div>
          </div>
        </div>
        <MonthNav
          monthLabel={monthLabel}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onPrint={onPrint}
        />
        <SyncControls
          syncId={syncId}
          syncIdDraft={syncIdDraft}
          syncStatus={syncStatus}
          onSyncIdChange={onSyncIdChange}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  )
}

/**
 * Month navigation controls (prev/next + print action).
 */
/**
 * @param {Object} props
 * @param {string} props.monthLabel
 * @param {() => void} props.onPrevMonth
 * @param {() => void} props.onNextMonth
 * @param {() => void} props.onPrint
 */
export function MonthNav({ monthLabel, onPrevMonth, onNextMonth, onPrint }) {
  return (
    <div className="header-month-controls">
      <div className="month-navigation">
        <button className="month-nav-btn" onClick={onPrevMonth} aria-label="Mês anterior" title="Mês anterior">
          ←
        </button>
        <span className="current-month">{monthLabel}</span>
        <button className="month-nav-btn" onClick={onNextMonth} aria-label="Próximo mês" title="Próximo mês">
          →
        </button>
      </div>
      <div className="month-actions">
        <button className="secondary print-btn" onClick={onPrint}>
          Imprimir
        </button>
      </div>
    </div>
  )
}

/**
 * Sync ID input and connect/disconnect controls.
 */
/**
 * @param {Object} props
 * @param {string} props.syncId
 * @param {string} props.syncIdDraft
 * @param {'off' | 'loading' | 'ok' | 'error'} props.syncStatus
 * @param {(value: string) => void} props.onSyncIdChange
 * @param {() => void} props.onConnect
 * @param {() => void} props.onDisconnect
 */
export function SyncControls({
  syncId,
  syncIdDraft,
  syncStatus,
  onSyncIdChange,
  onConnect,
  onDisconnect,
}) {
  const { statusClass, statusLabel } = getSyncStatusPresentation(syncId, syncStatus)

  // Derive button presentation based on state
  const btn = getSyncButtonPresentation({ syncId, syncStatus, syncIdDraft, onConnect, onDisconnect })

  return (
    <div className="sync-group">
      <div className="sync-id-row">
        <div className="sync-id-label">
          <label className="sync-label" htmlFor="sync-id">
            ID
          </label>
          <span className={statusClass} aria-label={statusLabel} title={statusLabel} />
        </div>
        <input
          id="sync-id"
          className="cell-input sync-input"
          placeholder="opcional"
          value={syncIdDraft}
          onChange={event => onSyncIdChange(event.target.value.trim())}
        />
        <div className="sync-actions-inline">
          <button
            className={`sync-btn ${btn.variant}`}
            onClick={btn.onClick}
            disabled={btn.disabled}
            aria-label={btn.aria}
            title={btn.title}
          >
            <span className="sync-icon" aria-hidden>
              {btn.icon}
            </span>
            <span>{btn.label}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function getSyncStatusPresentation(syncId, syncStatus) {
  if (!syncId) {
    return { statusClass: 'sync-dot off', statusLabel: 'Sync desligado' }
  }
  if (syncStatus === 'ok') {
    return { statusClass: 'sync-dot ok', statusLabel: 'Sync OK' }
  }
  if (syncStatus === 'loading') {
    return { statusClass: 'sync-dot loading', statusLabel: 'Sincronizando' }
  }
  return { statusClass: 'sync-dot error', statusLabel: 'Sync erro' }
}

function getSyncButtonPresentation({ syncId, syncStatus, syncIdDraft, onConnect, onDisconnect }) {
  // off: no syncId set
  if (!syncId) {
    return {
      variant: 'sync-btn--off',
      label: 'Conectar',
      icon: '○',
      onClick: onConnect,
      disabled: !syncIdDraft,
      aria: 'Conectar sync',
      title: 'Conectar',
    }
  }

  // loading: connecting or syncing
  if (syncStatus === 'loading') {
    return {
      variant: 'sync-btn--loading',
      label: 'Conectando…',
      icon: '⟳',
      onClick: () => {},
      disabled: true,
      aria: 'Sincronizando',
      title: 'Sincronizando',
    }
  }

  // ok: connected; allow disconnect
  if (syncStatus === 'ok') {
    return {
      variant: 'sync-btn--ok',
      label: 'Desconectar',
      icon: '✓',
      onClick: onDisconnect,
      disabled: false,
      aria: 'Desconectar sync',
      title: 'Desconectar',
    }
  }

  // error: show retry using existing syncId
  return {
    variant: 'sync-btn--error',
    label: 'Tentar novamente',
    icon: '⚠',
    onClick: onConnect,
    disabled: false,
    aria: 'Tentar novamente',
    title: 'Tentar novamente',
  }
}
