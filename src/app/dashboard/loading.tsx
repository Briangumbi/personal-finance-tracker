import { BalanceRing } from '@/components/balance-ring'

const ROWS = [
  { labelWidth: 72, valueWidth: 54, delay: 0 },
  { labelWidth: 96, valueWidth: 60, delay: 100 },
  { labelWidth: 50, valueWidth: 48, delay: 200 },
]

const SPEND_ROWS = [
  { labelWidth: 64, valueWidth: 48, fillWidth: 70, delay: 0 },
  { labelWidth: 80, valueWidth: 44, fillWidth: 45, delay: 120 },
  { labelWidth: 56, valueWidth: 40, fillWidth: 25, delay: 240 },
]

const TREND_BAR_HEIGHTS = [25, 55, 35, 70, 45, 60]

function ShimmerBar({
  width,
  height = 9,
  delay = 0,
  className = '',
}: {
  width: number
  height?: number
  delay?: number
  className?: string
}) {
  return (
    <span
      style={{ width, height, animationDelay: `${delay}ms` }}
      className={`inline-block flex-none animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded-[3px] bg-(--color-divider) ${className}`}
    />
  )
}

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
            <span className="font-(family-name:--font-heading) text-[26px] font-semibold leading-none opacity-40">
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

        <div className="border-b border-(--color-divider) px-5 py-5">
          <h6 className="mb-1 opacity-60">Spend this month</h6>
          <div className="flex flex-col gap-2.5 pt-2">
            {SPEND_ROWS.map((row, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-xs">
                  <ShimmerBar width={row.labelWidth} delay={row.delay} />
                  <ShimmerBar width={row.valueWidth} delay={row.delay + 100} />
                </div>
                <div className="h-[3px] rounded-full bg-(--color-divider) opacity-40">
                  <div
                    style={{ width: `${row.fillWidth}%`, animationDelay: `${row.delay}ms` }}
                    className="h-full animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded-full bg-(--color-divider)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-5">
          <h6 className="mb-1 opacity-60">Spend trend</h6>
          <ShimmerBar width={92} height={9} className="mb-3" />
          <div className="flex h-24 items-end gap-2 border-b border-(--color-divider)">
            {TREND_BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-end">
                <div
                  style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                  className="mx-auto w-full max-w-6 animate-[chitShimmer_1.5s_ease-in-out_infinite] rounded-t-[4px] bg-(--color-divider)"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {TREND_BAR_HEIGHTS.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <ShimmerBar width={24} height={8} delay={i * 80} />
                <ShimmerBar width={32} height={8} delay={i * 80 + 80} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
