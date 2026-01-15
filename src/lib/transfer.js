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

function countDateIssues(items, month) {
  let outOfMonth = 0
  let missingDate = 0
  for (const it of items) {
    const date = typeof it?.date === 'string' ? it.date : ''
    if (!date) {
      missingDate += 1
      continue
    }
    if (month && !date.startsWith(month)) outOfMonth += 1
  }
  return { outOfMonth, missingDate }
}

export function validateMonthImport(payload, activeMonth) {
  const errors = []
  const warnings = []

  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['Arquivo inválido.'], warnings: [], summary: null, payload: null }
  }

  if (payload.schema !== EXPORT_SCHEMA) {
    errors.push('Schema inválido. Exporte novamente o mês.')
  }

  const month = typeof payload.month === 'string' ? payload.month : ''
  if (!/^\d{4}-\d{2}$/.test(month)) {
    errors.push('Mês inválido no arquivo.')
  }

  if (activeMonth && month && activeMonth !== month) {
    errors.push(`Arquivo pertence ao mês ${month}. Mude para esse mês antes de importar.`)
  }

  const createdAt = typeof payload.createdAt === 'string' ? payload.createdAt : ''
  if (!createdAt) {
    errors.push('Data de criação ausente no arquivo.')
  }

  const entradasRows = Array.isArray(payload.entradasRows) ? payload.entradasRows : []
  const ledgerItems = Array.isArray(payload.ledgerItems) ? payload.ledgerItems : []
  if (!Array.isArray(payload.entradasRows)) {
    errors.push('Entradas inválidas no arquivo.')
  }
  if (!Array.isArray(payload.ledgerItems)) {
    errors.push('Lançamentos inválidos no arquivo.')
  }

  const entradasIssues = countDateIssues(entradasRows, month)
  const ledgerIssues = countDateIssues(ledgerItems, month)

  if (entradasIssues.missingDate > 0) {
    warnings.push(`${entradasIssues.missingDate} entrada(s) sem data.`)
  }
  if (entradasIssues.outOfMonth > 0) {
    warnings.push(`${entradasIssues.outOfMonth} entrada(s) fora do mês.`)
  }
  if (ledgerIssues.missingDate > 0) {
    warnings.push(`${ledgerIssues.missingDate} lançamento(s) sem data.`)
  }
  if (ledgerIssues.outOfMonth > 0) {
    warnings.push(`${ledgerIssues.outOfMonth} lançamento(s) fora do mês.`)
  }

  const summary = {
    month,
    createdAt,
    entradasCount: entradasRows.length,
    ledgerCount: ledgerItems.length,
    entradasIssues,
    ledgerIssues,
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary,
    payload: { month, createdAt, entradasRows, ledgerItems },
  }
}
