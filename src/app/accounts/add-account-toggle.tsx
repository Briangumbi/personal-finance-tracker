'use client'

import { useState } from 'react'
import { AccountForm } from './account-form'
import type { BankProvider } from '@/lib/bank-providers'

export function AddAccountToggle({
  defaultOpen,
  providers,
}: {
  defaultOpen: boolean
  providers: BankProvider[]
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-block">
        + Add account
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-(--radius-md) border border-dashed border-(--color-divider) p-4.5">
      <div className="flex items-center justify-between">
        <h6 className="opacity-60">Add account</h6>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancel
        </button>
      </div>
      <AccountForm providers={providers} />
    </div>
  )
}
