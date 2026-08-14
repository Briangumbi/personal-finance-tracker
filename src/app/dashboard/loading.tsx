import { BalanceRing } from '@/components/balance-ring'

const ROWS = [
  { labelWidth: 72, valueWidth: 54, delay: 0 },
  { labelWidth: 96, valueWidth: 60, delay: 100 },
  { labelWidth: 50, valueWidth: 48, delay: 200 },
]

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="nav">
        <div className="mx-auto flex w-full max-w-2xl items-center">
          <span className="nav-brand">Chit</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-5 pt-7 pb-5">
          <BalanceRing variant="loading">
            <span className="text-[10px] tracking-[0.12em] uppercase text-(--color-accent-700)">
              Total balance
            </span>
            <span className="font-(family-name:--font-heading) text-[26px] font-semibold opacity-40">
              &middot;&middot;&middot;
            </span>
          </BalanceRing>
          <p className="mt-2 text-[11px] text-muted">Fetching balances&hellip;</p>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <h6 className="opacity-60">Accounts</h6>
          {ROWS.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-4 w-4 flex-none animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded border border-dashed border-(--color-divider)"
                style={{ animationDelay: `${row.delay}ms` }}
              />
              <div
                style={{ width: row.labelWidth, animationDelay: `${row.delay}ms` }}
                className="h-[9px] flex-none animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded-[3px] bg-(--color-divider)"
              />
              <span className="h-px flex-1 self-end border-b border-dotted border-(--color-divider)" />
              <div
                style={{ width: row.valueWidth, animationDelay: `${row.delay + 150}ms` }}
                className="h-[9px] flex-none animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded-[3px] bg-(--color-divider)"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
