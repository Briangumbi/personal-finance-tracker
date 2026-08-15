export type Category = {
  id: string
  name: string
  kind: 'income' | 'expense'
}

export type TransactionAccount = {
  id: string
  name: string
  currency: string
}

export type Transaction = {
  id: string
  direction: 'in' | 'out'
  amount: number
  currency: string
  note: string | null
  counterparty: string | null
  fee_amount: number | null
  occurred_on: string
  accounts: { name: string } | null
  categories: { name: string } | null
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}
