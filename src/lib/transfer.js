export const EXPORT_SCHEMA = 'cash-ledger.export.v1'

export function buildMonthExport({ month, entradasRows, ledgerItems }) {
  return {
    schema: EXPORT_SCHEMA,
    month: typeof month === 'string' ? month : '',
    createdAt: new Date().toISOString(),
    entradasRows: Array.isArray(entradasRows) ? entradasRows : [],
    ledgerItems: Array.isArray(ledgerItems) ? ledgerItems : [],
  }
}
