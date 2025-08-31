import { describe, it, expect, vi } from 'vitest'
import { fetchJson } from './fetch.js'

function mockResponse(body, ok = true) {
  return {
    ok,
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: { get: () => 'application/json' },
  }
}

describe('fetchJson', () => {
  it('parses JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse({ ok: 1 }))
    globalThis.fetch = mockFetch
    const data = await fetchJson('/test')
    expect(data).toEqual({ ok: 1 })
  })

  it('retries on failure', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(mockResponse({ ok: 1 }))
    globalThis.fetch = mockFetch
    const data = await fetchJson('/test', {}, { retries: 1, timeout: 100 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(data).toEqual({ ok: 1 })
  })

  it('times out', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn((_, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    )
    globalThis.fetch = mockFetch
    const p = fetchJson('/timeout', {}, { timeout: 10, retries: 0 })
    const expectation = expect(p).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(20)
    await expectation
    vi.useRealTimers()
  })
})
