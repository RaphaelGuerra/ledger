const PREFIX = 'ledger.v1.data.'
const SYNC_ID_KEY = 'ledger.v1.syncId'

import { encryptJSON, decryptJSON, isEncryptedEnvelope } from './crypto.js'

function toBase64Url(buf) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function routeIdForSyncId(syncId) {
  if (!syncId) throw new Error('syncId required')
  const enc = new TextEncoder().encode(syncId)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return toBase64Url(digest)
}

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
    const routeId = await routeIdForSyncId(syncId)
    const res = await fetch(`/api/storage/${encodeURIComponent(routeId)}/${encodeURIComponent(month)}`)
    if (!res.ok) return { ok: false, data: null }
    const data = await res.json()
    if (data === null) return { ok: true, data: null }
    if (!isEncryptedEnvelope(data)) return { ok: false, data: null }
    try {
      const plain = await decryptJSON(data, syncId)
      return { ok: true, data: plain }
    } catch {
      return { ok: false, data: null }
    }
  } catch {
    return { ok: false, data: null }
  }
}

export const saveRemoteDebounced = debounce(async (syncId, month, data, onDone) => {
  try {
    let body
    try {
      const encrypted = await encryptJSON(data, syncId)
      body = JSON.stringify(encrypted)
    } catch {
      if (typeof onDone === 'function') onDone(false)
      return
    }
    const routeId = await routeIdForSyncId(syncId)
    const res = await fetch(`/api/storage/${encodeURIComponent(routeId)}/${encodeURIComponent(month)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (typeof onDone === 'function') onDone(res.ok)
  } catch {
    if (typeof onDone === 'function') onDone(false)
  }
}, 500)
