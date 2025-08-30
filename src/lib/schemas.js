import { z } from 'zod'

export const Account = z.object({
  accountId: z.string(),
  name: z.string(),
})

export const TxLine = z.object({
  accountId: z.string(),
  debitCents: z.bigint().nonnegative(),
  creditCents: z.bigint().nonnegative(),
}).refine(
  (l) => !(l.debitCents > 0n && l.creditCents > 0n),
  { message: 'line cannot have both debit and credit' }
)

export const TransactionCreate = z.object({
  idempotencyKey: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memo: z.string().optional(),
  lines: z.array(TxLine).min(1),
}).superRefine((tx, ctx) => {
  const debit = tx.lines.reduce((s, l) => s + l.debitCents, 0n)
  const credit = tx.lines.reduce((s, l) => s + l.creditCents, 0n)
  if (debit !== credit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'transaction not balanced',
    })
  }
})
