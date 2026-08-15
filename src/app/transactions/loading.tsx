const TAG_WIDTHS = [52, 64, 58, 70, 46]

const ROWS = [
  { line1: 120, line2: 90, amount: 56, delay: 0 },
  { line1: 100, line2: 110, amount: 48, delay: 100 },
  { line1: 140, line2: 80, amount: 60, delay: 200 },
  { line1: 90, line2: 100, amount: 52, delay: 300 },
]

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

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="nav">
        <div className="mx-auto flex w-full max-w-2xl items-center">
          <span className="nav-brand">Chit</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Transactions</h2>
          <p className="text-sm text-muted">
            Log money moving in or out of any of your accounts.
          </p>
        </div>

        <div className="rounded-(--radius-md) border border-(--color-divider) p-4.5">
          <div className="flex flex-col gap-4.5">
            <div className="border-t border-(--color-divider) pt-3.5">
              <ShimmerBar width={168} height={11} />
            </div>

            <div className="seg w-full">
              <div className="seg-opt flex-1 justify-center opacity-40" />
              <div className="seg-opt flex-1 justify-center opacity-40" />
            </div>

            <div className="field">
              <ShimmerBar width={52} height={9} className="mb-[5px]" />
              <div className="input flex items-center">
                <ShimmerBar width={96} height={9} />
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={52} height={9} className="mb-[5px]" />
              <div className="flex items-baseline gap-2 rounded-(--radius-md) border border-(--color-divider) px-3 py-2.5">
                <ShimmerBar width={92} height={22} />
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={60} height={9} className="mb-[5px]" />
              <div className="input flex items-center">
                <ShimmerBar width={40} height={9} />
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={30} height={9} className="mb-[5px]" />
              <div className="input flex items-center">
                <ShimmerBar width={80} height={9} />
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={54} height={9} className="mb-[5px]" />
              <div className="flex flex-wrap gap-2">
                {TAG_WIDTHS.map((w, i) => (
                  <span
                    key={i}
                    className="tag"
                    style={{ borderColor: 'var(--color-divider)' }}
                  >
                    <ShimmerBar width={w} height={9} delay={i * 60} />
                  </span>
                ))}
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={70} height={9} className="mb-[5px]" />
              <div className="input flex items-center">
                <ShimmerBar width={110} height={9} />
              </div>
            </div>

            <div className="field">
              <ShimmerBar width={40} height={9} className="mb-[5px]" />
              <div className="input flex items-center">
                <ShimmerBar width={100} height={9} />
              </div>
            </div>

            <div className="btn btn-primary btn-block">
              <ShimmerBar width={70} height={10} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-(--radius-md) border border-(--color-divider) p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="field">
              <ShimmerBar width={48} height={9} delay={i * 80} className="mb-[5px]" />
              <div className="input flex w-24 items-center">
                <ShimmerBar width={56} height={9} delay={i * 80 + 40} />
              </div>
            </div>
          ))}
          <div className="btn btn-secondary">
            <ShimmerBar width={40} height={10} />
          </div>
        </div>

        <ul className="flex flex-col">
          {ROWS.map((row, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-3 border-b border-(--color-divider) py-3 last:border-b-0"
            >
              <div className="flex flex-col gap-1.5">
                <ShimmerBar width={row.line1} height={10} delay={row.delay} />
                <ShimmerBar width={row.line2} height={8} delay={row.delay + 80} />
              </div>
              <div className="flex flex-none items-center gap-3">
                <ShimmerBar width={row.amount} height={10} delay={row.delay + 40} />
                <ShimmerBar width={32} height={9} delay={row.delay + 120} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
