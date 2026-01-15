const PREFIX = 'ledger.v1.data.'
const SYNC_ID_KEY = 'ledger.v1.syncId'

import { encryptJSON, decryptJSON, isEncryptedEnvelope } from './crypto.js'

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

// Always require encryption when using remote: the Sync ID is the passphrase.
export async function loadRemote(syncId, month) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`)
    if (!res.ok) return { ok: false, data: null, status: res.status }
    const data = await res.json()
    if (data === null) return { ok: true, data: null, status: res.status }
    if (!isEncryptedEnvelope(data)) return { ok: false, data: null, status: res.status }
    try {
      const plain = await decryptJSON(data, syncId)
      return { ok: true, data: plain, status: res.status }
    } catch {
      return { ok: false, data: null, status: res.status }
    }
  } catch {
    return { ok: false, data: null, status: 0 }
  }
}

export const saveRemoteDebounced = debounce(async (syncId, month, data, onDone) => {
  try {
    let body
    try {
      const encrypted = await encryptJSON(data, syncId)
      body = JSON.stringify(encrypted)
    } catch {
      if (typeof onDone === 'function') onDone({ ok: false, status: 0 })
      return
    }
    const res = await fetch(`/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (typeof onDone === 'function') onDone({ ok: res.ok, status: res.status })
  } catch {
    if (typeof onDone === 'function') onDone({ ok: false, status: 0 })
  }
}, 500)
