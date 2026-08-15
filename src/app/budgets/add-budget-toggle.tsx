'use client'

import { useState } from 'react'
import { BudgetForm } from './budget-form'

type Category = {
  id: string
  name: string
}

export function AddBudgetToggle({
  defaultOpen,
  categories,
}: {
  defaultOpen: boolean
  categories: Category[]
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-block">
        + Add budget
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-(--radius-md) border border-dashed border-(--color-divider) p-4.5">
      <div className="flex items-center justify-between">
        <h6 className="opacity-60">Add budget</h6>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancel
        </button>
      </div>
      <BudgetForm categories={categories} />
    </div>
  )
}
