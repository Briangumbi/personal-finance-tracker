'use client'

import { useActionState, useState } from 'react'
import { createBudget, type BudgetFormState } from './actions'
import { formatCurrency } from '@/lib/currency'

type Category = {
  id: string
  name: string
}

const initialState: BudgetFormState = { error: null }

export function BudgetForm({
  categories,
  spendByCategory,
  spendCurrencyLabel,
}: {
  categories: Category[]
  spendByCategory: Record<string, number>
  spendCurrencyLabel: string
}) {
  const [state, formAction, pending] = useActionState(createBudget, initialState)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [limitInput, setLimitInput] = useState('')

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted">
        Every expense category already has a monthly budget.
      </p>
    )
  }

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name ?? ''
  const spentSoFar = spendByCategory[selectedCategoryName] ?? 0
  const enteredLimit = Number(limitInput)
  const showOverspendWarning =
    Number.isFinite(enteredLimit) && enteredLimit > 0 && spentSoFar > 0 && enteredLimit < spentSoFar

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="field">
        <label>Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`tag ${c.id === categoryId ? 'tag-accent' : 'tag-outline'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input type="hidden" name="categoryId" value={categoryId} />
      </div>

      <div className="field">
        <label htmlFor="limitAmount">Monthly limit</label>
        <input
          id="limitAmount"
          name="limitAmount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={limitInput}
          onChange={(e) => setLimitInput(e.target.value)}
          placeholder="0.00"
          className="input"
        />
        <p className="mt-1 text-[11px] text-muted">
          Same currency as your dashboard&apos;s monthly spend total (your account
          currency, or the converted total if you hold more than one).
        </p>
        {showOverspendWarning && (
          <p className="mt-1 text-[11px] text-muted">
            You&apos;ve already spent {formatCurrency(spentSoFar, spendCurrencyLabel)} in{' '}
            {selectedCategoryName} this month — this limit would start out over budget.
          </p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-(--color-negative)" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? 'Saving…' : 'Save budget'}
      </button>
    </form>
  )
}
