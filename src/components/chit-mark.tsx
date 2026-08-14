const SIZES = {
  sm: { outer: 48, inner: 40, font: 18 },
  md: { outer: 64, inner: 52, font: 22 },
} as const

export function ChitMark({ size = 'sm' }: { size?: keyof typeof SIZES }) {
  const { outer, inner, font } = SIZES[size]

  return (
    <div
      style={{ width: outer, height: outer, transform: 'rotate(-6deg)' }}
      className="flex flex-none items-center justify-center rounded-full border-2 border-(--color-accent)"
    >
      <div
        style={{ width: inner, height: inner }}
        className="flex items-center justify-center rounded-full border border-dashed border-(--color-accent-400)"
      >
        <span
          style={{ fontSize: font }}
          className="font-(family-name:--font-heading) font-semibold text-(--color-accent-700)"
        >
          C
        </span>
      </div>
    </div>
  )
}
