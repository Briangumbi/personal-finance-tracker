'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { deleteBudget, updateBudget, type BudgetFormState } from './actions'

const initialState: BudgetFormState = { error: null }

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
  categoryName,
  limitAmount,
}: {
  id: string
  categoryName: string
  limitAmount: number
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState(updateBudget, initialState)
  const wasPending = useRef(false)

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
          <p className="text-[13px]">{categoryName}</p>
          <div className="flex flex-none items-center gap-2">
            <input
              name="limitAmount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={limitAmount}
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
