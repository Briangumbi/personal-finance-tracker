'use client'

import { useActionState } from 'react'
import { resetPassword } from './actions'
import type { AuthFormState } from '@/app/login/actions'
import { ChitMark } from '@/components/chit-mark'

const initialState: AuthFormState = { error: null }

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) shadow-(--shadow-lg)"
      >
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-7 pt-10 pb-7">
          <ChitMark size="sm" />
          <h2 className="mt-2.5">Set a new password</h2>
        </div>

        <div className="flex flex-col gap-4 px-7 pt-6 pb-8">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="field">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
              />
            </div>

            {state.error && (
              <p className="text-sm text-(--color-negative)" role="alert">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block">
              {pending ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
