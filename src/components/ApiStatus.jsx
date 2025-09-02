import { useEffect, useState } from 'react'
import { env } from '../lib/env.js'
import { fetchJson } from '../lib/fetch.js'

export default function ApiStatus() {
  const hasUrl = !!env.VITE_API_URL
  const [status, setStatus] = useState(hasUrl ? 'checking' : 'not-configured') // checking | online | offline | not-configured

  useEffect(() => {
    let cancelled = false
    if (!hasUrl) return () => { }
    async function ping() {
      try {
        // Try simple GET; accept empty body or JSON
        await fetchJson(env.VITE_API_URL, { method: 'GET' }, { timeout: 1500, retries: 0 })
        if (!cancelled) setStatus('online')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }
    ping()
    return () => {
      cancelled = true
    }
  }, [hasUrl])

  const label =
    status === 'checking'
      ? 'Verificando API…'
      : status === 'online'
      ? 'API: Conectado'
      : status === 'offline'
      ? 'API: Offline'
      : 'API: Não configurada'
  const cls = `api-status ${status}`

  return <span className={cls} title={env.VITE_API_URL}>{label}</span>
}
