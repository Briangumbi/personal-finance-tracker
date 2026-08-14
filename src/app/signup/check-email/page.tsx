import Link from 'next/link'
import { ChitMark } from '@/components/chit-mark'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) px-7 py-10 text-center shadow-(--shadow-lg)"
      >
        <ChitMark size="sm" />
        <h2 className="mt-2">Check your email</h2>
        <p className="text-sm text-muted">
          We sent you a confirmation link. Click it to activate your account, then log in.
        </p>
        <Link href="/login" className="btn btn-ghost mt-1">
          Back to login
        </Link>
      </div>
    </div>
  )
}
