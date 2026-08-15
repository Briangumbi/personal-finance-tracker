'use client'

import { useEffect } from 'react'
import { BalanceRing } from '@/components/balance-ring'

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="nav">
        <div className="mx-auto flex w-full max-w-2xl items-center">
          <span className="nav-brand">Chit</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-5 pt-7 pb-5">
          <BalanceRing variant="error">
            <span className="text-[10px] tracking-[0.12em] uppercase opacity-55">
              Total balance
            </span>
            <span className="font-(family-name:--font-heading) text-[26px] font-semibold leading-none opacity-40">
              &mdash;
            </span>
          </BalanceRing>
          <p className="mt-2 text-xs text-muted">Balance unavailable</p>
          <button type="button" onClick={() => retry()} className="btn btn-ghost mt-1">
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}
