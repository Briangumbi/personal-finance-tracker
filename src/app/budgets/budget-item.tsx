'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { deleteBudget, updateBudget, type BudgetFormState } from './actions'
import { formatCurrency } from '@/lib/currency'

const initialState: BudgetFormState = { error: null }

type Category = { id: string; name: string }

// Budgets deliberately don't track a currency (see migration notes) — a
// plain number, not formatCurrency, since there's no currency code to
// associate it with here.
function formatLimit(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function BudgetItem({
  id,
  categoryId,
  categoryName,
  limitAmount,
  availableCategories,
  spendByCategory,
  spendCurrencyLabel,
}: {
  id: string
  categoryId: string
  categoryName: string
  limitAmount: number
  availableCategories: Category[]
  spendByCategory: Record<string, number>
  spendCurrencyLabel: string
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState(updateBudget, initialState)
  const wasPending = useRef(false)

  // This budget's own category plus every category not yet budgeted by any
  // other budget — so keeping the current one is always a valid, preselected
  // option, not just the newly-available ones.
  const categoryOptions = useMemo(() => {
    const options = [{ id: categoryId, name: categoryName }, ...availableCategories]
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [categoryId, categoryName, availableCategories])

  // Controlled (not defaultValue) so the overspend warning below can react
  // live as the user changes either field, before they ever hit Save.
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [limitInput, setLimitInput] = useState(String(limitAmount))

  const selectedCategoryName =
    categoryOptions.find((c) => c.id === selectedCategoryId)?.name ?? categoryName
  const spentSoFar = spendByCategory[selectedCategoryName] ?? 0
  const enteredLimit = Number(limitInput)
  const showOverspendWarning =
    Number.isFinite(enteredLimit) && enteredLimit > 0 && spentSoFar > 0 && enteredLimit < spentSoFar

  // updateBudget doesn't redirect (it edits in place on this same list), so
  // once a pending submission finishes with no error, collapse back to
  // display mode ourselves.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setEditing(false)
    }
    wasPending.current = pending
  }, [pending, state.error])

  if (editing) {
    return (
      <li className="flex flex-col gap-2 border-b border-(--color-divider) py-3 last:border-b-0">
        <form action={formAction} className="flex items-center justify-between gap-3">
          <input type="hidden" name="id" value={id} />
          <select
            name="categoryId"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="input flex-1 py-1 text-[13px]"
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex flex-none items-center gap-2">
            <input
              name="limitAmount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              autoFocus
              className="input w-24 py-1 text-[13px]"
            />
            <button type="submit" disabled={pending} className="btn btn-ghost">
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
        {showOverspendWarning && (
          <p className="text-[11px] text-muted">
            You&apos;ve already spent {formatCurrency(spentSoFar, spendCurrencyLabel)} in{' '}
            {selectedCategoryName} this month — this limit would start out over budget.
          </p>
        )}
        {state.error && (
          <p className="text-sm text-(--color-negative)" role="alert">
            {state.error}
          </p>
        )}
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 border-b border-(--color-divider) py-3 last:border-b-0">
      <div>
        <p className="text-[13px]">{categoryName}</p>
        <p className="text-[11px] text-muted">Monthly budget</p>
      </div>
      <div className="flex flex-none items-center gap-3">
        <span className="whitespace-nowrap text-[13px] [font-variant-numeric:tabular-nums]">
          {formatLimit(limitAmount)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] text-muted hover:text-(--color-text)"
        >
          Edit
        </button>
        <form action={deleteBudget}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            aria-label={`Delete budget for ${categoryName}`}
            className="text-[11px] text-muted hover:text-(--color-negative)"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  )
}
