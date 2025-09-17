/**
 * Aggregations for Entradas/Créditos and Acumulado summaries.
 */

/**
 * Compute credit totals from visible daily rows.
 * @param {Array<{dia?:object, noite?:object}>} rows
 * @returns {{ totalEntradas:number, totalCozinha:number, totalBar:number, totalOutros:number, totalCreditos:number }}
 */
export function computeCreditTotals(rows) {
  let totalEntradas = 0
  let totalCozinha = 0
  let totalBar = 0
  let totalOutros = 0
  for (const r of rows || []) {
    totalEntradas += (r?.dia?.totalEntradas || 0) + (r?.noite?.totalEntradas || 0)
    totalCozinha += (r?.dia?.cozinha || 0) + (r?.noite?.cozinha || 0)
    totalBar += (r?.dia?.bar || 0) + (r?.noite?.bar || 0)
    totalOutros += (r?.dia?.outros || 0) + (r?.noite?.outros || 0)
  }
  const totalCreditos = totalEntradas + totalCozinha + totalBar + totalOutros
  return { totalEntradas, totalCozinha, totalBar, totalOutros, totalCreditos }
}

/**
 * Compute accumulated stats split by Dia/Noite/Total.
 * @param {Array<{dia?:object, noite?:object}>} rows
 */
export function computeAcumulado(rows) {
  let diaN = 0, diaTot = 0, diaC = 0, diaB = 0, diaO = 0
  let noiN = 0, noiTot = 0, noiC = 0, noiB = 0, noiO = 0
  for (const r of rows || []) {
    diaN += r?.dia?.nEntradas || 0
    diaTot += r?.dia?.totalEntradas || 0
    diaC += r?.dia?.cozinha || 0
    diaB += r?.dia?.bar || 0
    diaO += r?.dia?.outros || 0

    noiN += r?.noite?.nEntradas || 0
    noiTot += r?.noite?.totalEntradas || 0
    noiC += r?.noite?.cozinha || 0
    noiB += r?.noite?.bar || 0
    noiO += r?.noite?.outros || 0
  }
  const totN = diaN + noiN
  const totTot = diaTot + noiTot
  const totC = diaC + noiC
  const totB = diaB + noiB
  const totO = diaO + noiO
  const mediaDia = diaN > 0 ? diaTot / diaN : ''
  const mediaNoite = noiN > 0 ? noiTot / noiN : ''
  const mediaTot = totN > 0 ? totTot / totN : ''
  return {
    dia: { n: diaN, entradas: diaTot, cozinha: diaC, bar: diaB, outros: diaO, media: mediaDia },
    noite: { n: noiN, entradas: noiTot, cozinha: noiC, bar: noiB, outros: noiO, media: mediaNoite },
    total: { n: totN, entradas: totTot, cozinha: totC, bar: totB, outros: totO, media: mediaTot },
  }
}

