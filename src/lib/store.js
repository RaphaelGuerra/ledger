const PREFIX = 'ledger.v1.data.'
const SYNC_ID_KEY = 'ledger.v1.syncId'

function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

export function getSyncId() {
  try { return localStorage.getItem(SYNC_ID_KEY) || '' } catch { return '' }
}
export function setSyncId(id) {
  try { if (id) localStorage.setItem(SYNC_ID_KEY, id); else localStorage.removeItem(SYNC_ID_KEY) } catch { /* ignore storage errors */ }
}

export function monthKey(month) {
  return `${PREFIX}${month}`
}

export function loadLocal(month) {
  try {
    const raw = localStorage.getItem(monthKey(month))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const saveLocalDebounced = debounce((month, data) => {
  try { localStorage.setItem(monthKey(month), JSON.stringify(data)) } catch { /* ignore storage errors */ }
}, 300)

export async function loadRemote(syncId, month) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`)
    if (!res.ok) return { ok: false, data: null }
    const data = await res.json()
    return { ok: true, data }
  } catch {
    return { ok: false, data: null }
  }
}

export const saveRemoteDebounced = debounce(async (syncId, month, data, onDone) => {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (typeof onDone === 'function') onDone(res.ok)
  } catch {
    if (typeof onDone === 'function') onDone(false)
  }
}, 500)
