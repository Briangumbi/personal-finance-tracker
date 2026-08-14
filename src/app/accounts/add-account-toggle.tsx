'use client'

import { useState } from 'react'
import { AccountForm } from './account-form'

export function AddAccountToggle({ defaultOpen }: { defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Add account
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Add account</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Cancel
        </button>
      </div>
      <AccountForm />
    </div>
  )
}
