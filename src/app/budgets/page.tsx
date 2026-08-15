import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import type { Budget } from '@/lib/budgets'
import { deleteBudget } from './actions'
import { AddBudgetToggle } from './add-budget-toggle'

// Budgets deliberately don't track a currency (see migration notes) — a
// plain number, not formatCurrency, since there's no currency code to
// associate it with here.
function formatLimit(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: budgets, error }, { data: expenseCategories }] = await Promise.all([
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
  ])

  const budgetedCategoryIds = new Set((budgets ?? []).map((b) => b.categories?.id))
  const availableCategories = (expenseCategories ?? []).filter(
    (c) => !budgetedCategoryIds.has(c.id)
  )

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader email={user.email ?? ''} active="/budgets" />

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
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 border-b border-(--color-divider) py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[13px]">{b.categories?.name ?? 'Uncategorized'}</p>
                  <p className="text-[11px] text-muted">Monthly budget</p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span className="whitespace-nowrap text-[13px] [font-variant-numeric:tabular-nums]">
                    {formatLimit(b.limit_amount)}
                  </span>
                  <form action={deleteBudget}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      aria-label={`Delete budget for ${b.categories?.name ?? 'category'}`}
                      className="text-[11px] text-muted hover:text-(--color-negative)"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
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
        />
      </div>
    </div>
  )
}
