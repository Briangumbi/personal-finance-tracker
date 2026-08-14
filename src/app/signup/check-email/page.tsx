import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Check your email</h1>
        <p className="text-sm text-neutral-500">
          We sent you a confirmation link. Click it to activate your account, then log in.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-neutral-900 underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
