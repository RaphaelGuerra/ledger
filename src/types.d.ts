/** Shared types for the ledger app (JSDoc friendly). */

export type ISODate = string // YYYY-MM-DD
export type MonthStr = string // YYYY-MM

export interface ShiftData {
  nEntradas: number | ''
  totalEntradas: number | ''
  cozinha: number | ''
  bar: number | ''
  outros: number | ''
}

export interface EntradaRow {
  id: string
  date: ISODate
  dia: ShiftData
  noite: ShiftData
}

export interface LedgerItem {
  id: string
  date: ISODate
  descricao: string
  valor: number | ''
}

export interface CreditTotals {
  totalEntradas: number
  totalCozinha: number
  totalBar: number
  totalOutros: number
  totalCreditos: number
}

export interface AcumuladoGroup {
  n: number
  entradas: number
  cozinha: number
  bar: number
  outros: number
  media: number | ''
}

export interface Acumulado {
  dia: AcumuladoGroup
  noite: AcumuladoGroup
  total: AcumuladoGroup
}

