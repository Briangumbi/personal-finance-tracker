'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from './actions'
import type { AuthFormState } from '@/app/login/actions'
import { ChitMark } from '@/components/chit-mark'

const initialState: AuthFormState = { error: null }

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) shadow-(--shadow-lg)"
      >
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-7 pt-10 pb-7">
          <ChitMark size="sm" />
          <h2 className="mt-2.5">Reset your password</h2>
          <p className="text-center text-xs text-muted">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-7 pt-6 pb-8">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
              />
            </div>

            {state.error && (
              <p className="text-sm text-(--color-negative)" role="alert">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block">
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted">
            <Link href="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
