// Cloudflare Pages Function for syncing month data via KV
// Route: /api/storage/:user/:month
// Bind a KV namespace named LEDGER in your Pages project settings.

export async function onRequest(context) {
  const { request, params, env } = context
  const { user, month } = params
  const key = `${user}/${month}`
  const method = request.method.toUpperCase()

  // Require the "space" to be pre-provisioned: a marker key must exist.
  // To provision, create a KV key named `space:<SyncID>` with any value (e.g., "1").
  const spaceMarkerKey = `space:${user}`
  const spaceExists = await env.LEDGER.get(spaceMarkerKey)
  if (!spaceExists) {
    // Do not auto-create; deny access if the space is not provisioned.
    return new Response('Not Found', { status: 404 })
  }

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
