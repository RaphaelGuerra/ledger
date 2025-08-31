export async function fetchJson(url, options = {}, cfg = {}) {
  const {
    timeout = 8000,
    retries = 2,
    backoffMs = 250,
  } = cfg
  let attempt = 0
  while (attempt <= retries) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body:
          options.body && typeof options.body !== 'string'
            ? JSON.stringify(options.body)
            : options.body,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      return text ? JSON.parse(text) : null
    } catch (err) {
      if (attempt >= retries) throw err
      const delay = backoffMs * 2 ** attempt + Math.random() * 100
      await new Promise(r => setTimeout(r, delay))
      attempt += 1
    } finally {
      clearTimeout(timer)
    }
  }
}
