import { describe, it, expect } from 'vitest'
import { TransactionCreate } from './schemas.js'

describe('TransactionCreate schema', () => {
  it('accepts balanced transactions', () => {
    const data = {
      idempotencyKey: 'abc',
      date: '2024-01-01',
      lines: [
        { accountId: '1', debitCents: 100n, creditCents: 0n },
        { accountId: '2', debitCents: 0n, creditCents: 100n },
      ],
    }
    expect(() => TransactionCreate.parse(data)).not.toThrow()
  })

  it('rejects unbalanced transactions', () => {
    const data = {
      idempotencyKey: 'abc',
      date: '2024-01-01',
      lines: [
        { accountId: '1', debitCents: 100n, creditCents: 0n },
        { accountId: '2', debitCents: 0n, creditCents: 50n },
      ],
    }
    expect(() => TransactionCreate.parse(data)).toThrow()
  })
})
