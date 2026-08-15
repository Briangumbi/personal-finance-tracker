'use client'

import { useState } from 'react'

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a15.4 15.4 0 0 1-3.4 4.4M6.7 6.7C3.7 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function PrivateBalance({
  formatted,
  className,
}: {
  formatted: string
  className: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${className} transition-[filter] duration-200 ${
          revealed ? '' : 'blur-[6px] select-none'
        }`}
      >
        {formatted}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? 'Hide balance' : 'Show balance'}
        className="flex-none text-(--color-accent-700) opacity-70 hover:opacity-100"
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  )
}
