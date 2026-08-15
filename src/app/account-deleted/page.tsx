import Link from 'next/link'
import { ChitMark } from '@/components/chit-mark'

export const metadata = {
  title: 'Account deleted — Chit',
}

export default function AccountDeletedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) px-7 py-10 text-center shadow-(--shadow-lg)">
        <ChitMark size="sm" />
        <h2 className="mt-2">Account deleted</h2>
        <p className="text-sm text-muted">
          Your account and all its data have been permanently deleted. Thanks for trying Chit.
        </p>
        <Link href="/login" className="btn btn-secondary mt-2">
          Back to login
        </Link>
      </div>
    </div>
  )
}
