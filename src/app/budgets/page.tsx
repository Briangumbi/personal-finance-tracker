import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import type { Budget } from '@/lib/budgets'
import { getDisplayName } from '@/lib/profile'
import { getCategorySpendThisMonth } from '@/lib/spend'
import { AddBudgetToggle } from './add-budget-toggle'
import { BudgetItem } from './budget-item'

export default async function BudgetsPage() {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see middleware.ts for details) — claims.email matches user.email.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const displayName = await getDisplayName(supabase, user)

  const [{ data: budgets, error }, { data: expenseCategories }, categorySpend] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, limit_amount, categories (id, name)')
      .eq('period', 'monthly')
      .order('created_at', { ascending: true })
      .returns<Budget[]>(),
    supabase
      .from('categories')
      .select('id, name')
      .eq('kind', 'expense')
      .order('name', { ascending: true })
      .returns<{ id: string; name: string }[]>(),
    getCategorySpendThisMonth(supabase),
  ])
  const { spendByCategory, currencyLabel: spendCurrencyLabel } = categorySpend

  const budgetedCategoryIds = new Set((budgets ?? []).map((b) => b.categories?.id))
  const availableCategories = (expenseCategories ?? []).filter(
    (c) => !budgetedCategoryIds.has(c.id)
  )

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader displayName={displayName} active="/budgets" />

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Budgets</h2>
          <p className="text-sm text-muted">
            Set a monthly spending limit per category. You&apos;ll see an alert on
            the dashboard when you&apos;re near or over one.
          </p>
        </div>

        {error && (
          <p className="text-sm text-(--color-negative)" role="alert">
            Couldn&apos;t load budgets: {error.message}
          </p>
        )}

        {budgets && budgets.length > 0 && (
          <ul className="flex flex-col">
            {budgets.map((b) => (
              <BudgetItem
                key={b.id}
                id={b.id}
                categoryId={b.categories?.id ?? ''}
                categoryName={b.categories?.name ?? 'Uncategorized'}
                limitAmount={b.limit_amount}
                availableCategories={availableCategories}
                spendByCategory={spendByCategory}
                spendCurrencyLabel={spendCurrencyLabel}
              />
            ))}
          </ul>
        )}

        {!error && budgets && budgets.length === 0 && (
          <p className="rounded-(--radius-md) border border-dashed border-(--color-divider) p-6 text-center text-sm text-muted">
            No budgets yet — set one below to get an alert when you&apos;re near a limit.
          </p>
        )}

        <AddBudgetToggle
          key={availableCategories.length}
          defaultOpen={!budgets || budgets.length === 0}
          categories={availableCategories}
          spendByCategory={spendByCategory}
          spendCurrencyLabel={spendCurrencyLabel}
        />
      </div>
    </div>
  )
}
