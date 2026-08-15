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
      style={{ width: 184, height: 184, transform: 'rotate(-4deg)' }}
      className={`flex items-center justify-center rounded-full ${OUTER[variant]}`}
    >
      <div
        style={{ width: 164, height: 164 }}
        className={`flex flex-col items-center justify-center gap-0.5 rounded-full px-4 ${INNER[variant]}`}
      >
        {children}
      </div>
    </div>
  )
}

// Step the amount's font size down as the formatted string gets longer, so
// it always clears the ring's curve regardless of balance size or currency
// (e.g. "KES 42,300.00" vs "$85.00") rather than relying on a fixed size
// that only happens to fit short values.
const BALANCE_TEXT_SIZE_STEPS = [
  { maxLength: 9, className: 'text-[30px]' },
  { maxLength: 12, className: 'text-[25px]' },
  { maxLength: 15, className: 'text-[21px]' },
  { maxLength: 18, className: 'text-[18px]' },
] as const
const BALANCE_TEXT_SIZE_FALLBACK = 'text-[15px]'

export function balanceTextSizeClass(text: string): string {
  const step = BALANCE_TEXT_SIZE_STEPS.find((s) => text.length <= s.maxLength)
  return step?.className ?? BALANCE_TEXT_SIZE_FALLBACK
}
