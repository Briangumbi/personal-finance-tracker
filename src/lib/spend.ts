import type { SupabaseClient } from '@supabase/supabase-js'
import { BASE_CURRENCY, convertToBase, getExchangeRates } from '@/lib/fx'

type CategorySpendRow = {
  amount: number
  currency: string
  categories: { name: string } | null
}

export type CategorySpend = {
  // Keyed by category name (not id) — categories are already unique per
  // user by name (see categories_unique_name_per_scope), and this mirrors
  // how the dashboard's spend-this-month section already keys its rows.
  // A plain object, not a Map, so this can cross into a client component
  // as a prop without a serialization workaround.
  spendByCategory: Record<string, number>
  currencyLabel: string
  skipped: number
}

function firstOfMonthIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// This month's spend (direction = 'out'), grouped by category, converting
// to BASE_CURRENCY when the user's transactions span more than one
// currency — same logic the dashboard's "Spend this month" section uses,
// extracted here so budgets can warn against the same numbers instead of
// a reimplementation that risks drifting from what the dashboard shows.
export async function getCategorySpendThisMonth(
  supabase: SupabaseClient
): Promise<CategorySpend> {
  const { data: monthSpend } = await supabase
    .from('transactions')
    .select('amount, currency, categories (name)')
    .eq('direction', 'out')
    .gte('occurred_on', firstOfMonthIso())
    .returns<CategorySpendRow[]>()

  const spendCurrencies = new Set((monthSpend ?? []).map((t) => t.currency))
  const spendNeedsConversion = spendCurrencies.size > 1
  const spendRates = spendNeedsConversion ? await getExchangeRates() : null

  const spendByCategory: Record<string, number> = {}
  let skipped = 0
  for (const t of monthSpend ?? []) {
    const name = t.categories?.name ?? 'Uncategorized'
    const value = spendNeedsConversion
      ? spendRates
        ? convertToBase(t.amount, t.currency, spendRates)
        : null
      : t.amount
    if (value === null) {
      skipped += 1
      continue
    }
    spendByCategory[name] = (spendByCategory[name] ?? 0) + value
  }

  const currencyLabel = spendNeedsConversion ? BASE_CURRENCY : ([...spendCurrencies][0] ?? BASE_CURRENCY)

  return { spendByCategory, currencyLabel, skipped }
}
