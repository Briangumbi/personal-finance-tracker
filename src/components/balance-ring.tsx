const OUTER = {
  default: 'border-2 border-solid border-(--color-accent)',
  loading: 'border-2 border-dashed border-(--color-accent-400) animate-[chitPulseRing_1.8s_ease-out_infinite]',
  error: 'border-2 border-dashed border-(--color-divider)',
} as const

const INNER = {
  default: 'border border-dashed border-(--color-accent-400)',
  loading: 'border border-dashed border-(--color-divider)',
  error: 'border border-dashed border-(--color-divider)',
} as const

export function BalanceRing({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: keyof typeof OUTER
}) {
  return (
    <div
      style={{ width: 168, height: 168, transform: 'rotate(-4deg)' }}
      className={`flex items-center justify-center rounded-full ${OUTER[variant]}`}
    >
      <div
        style={{ width: 148, height: 148 }}
        className={`flex flex-col items-center justify-center gap-0.5 rounded-full ${INNER[variant]}`}
      >
        {children}
      </div>
    </div>
  )
}
