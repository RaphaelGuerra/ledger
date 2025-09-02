export async function onRequest(context) {
  const { request, env, params } = context
  const { user, month } = params
  if (!env.LEDGER) {
    return new Response(JSON.stringify({ error: 'KV not bound' }), { status: 500 })
  }
  if (!user || !month) {
    return new Response(JSON.stringify({ error: 'missing path params' }), { status: 400 })
  }
  const key = `v1:${user}:${month}`
  try {
    switch (request.method) {
      case 'GET': {
        const val = await env.LEDGER.get(key)
        if (!val) return new Response('Not found', { status: 404 })
        return new Response(val, { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      case 'PUT': {
        const body = await request.text()
        // basic validation
        if (!body || body.length > 512000) return new Response('Invalid body', { status: 400 })
        await env.LEDGER.put(key, body)
        return new Response('OK', { status: 200 })
      }
      case 'DELETE': {
        await env.LEDGER.delete(key)
        return new Response('OK', { status: 200 })
      }
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

