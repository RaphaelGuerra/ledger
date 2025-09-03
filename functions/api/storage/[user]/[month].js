// Cloudflare Pages Function for syncing month data via KV
// Route: /api/storage/:user/:month
// Bind a KV namespace named LEDGER in your Pages project settings.

export async function onRequest(context) {
  const { request, params, env } = context
  const { user, month } = params
  const key = `${user}/${month}`
  const method = request.method.toUpperCase()

  if (method === 'GET') {
    const val = await env.LEDGER.get(key)
    return new Response(val || 'null', { headers: { 'Content-Type': 'application/json' } })
  }

  if (method === 'PUT') {
    const text = await request.text()
    try {
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid')
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }
    await env.LEDGER.put(key, text)
    return new Response('', { status: 204 })
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET, PUT' },
  })
}

