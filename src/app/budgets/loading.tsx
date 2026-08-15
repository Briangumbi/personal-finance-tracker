const ROWS = [
  { name: 72, amount: 48, delay: 0 },
  { name: 56, amount: 44, delay: 120 },
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

export default function BudgetsLoading() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="nav">
        <div className="mx-auto flex w-full max-w-2xl items-center">
          <span className="nav-brand">Chit</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Budgets</h2>
          <p className="text-sm text-muted">
            Set a monthly spending limit per category. You&apos;ll see an alert on
            the dashboard when you&apos;re near or over one.
          </p>
        </div>

        <ul className="flex flex-col">
          {ROWS.map((row, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 border-b border-(--color-divider) py-3 last:border-b-0"
            >
              <div className="flex flex-col gap-1.5">
                <ShimmerBar width={row.name} height={10} delay={row.delay} />
                <ShimmerBar width={72} height={8} delay={row.delay + 80} />
              </div>
              <div className="flex flex-none items-center gap-3">
                <ShimmerBar width={row.amount} height={10} delay={row.delay + 40} />
                <ShimmerBar width={32} height={9} delay={row.delay + 120} />
              </div>
            </li>
          ))}
        </ul>

        <div className="btn btn-secondary btn-block">
          <ShimmerBar width={80} height={10} />
        </div>
      </div>
    </div>
  )
}
