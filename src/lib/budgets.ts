export type Budget = {
  id: string
  limit_amount: number
  categories: { id: string; name: string } | null
}
