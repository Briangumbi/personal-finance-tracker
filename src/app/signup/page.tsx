'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from './actions'
import type { AuthFormState } from '@/app/login/actions'
import { ChitMark } from '@/components/chit-mark'

const initialState: AuthFormState = { error: null }

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) shadow-(--shadow-lg)"
      >
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-7 pt-10 pb-7">
          <ChitMark size="sm" />
          <h2 className="mt-2.5">Chit</h2>
          <p className="text-center text-xs text-muted">Every account, one line.</p>
        </div>

        <div className="flex flex-col gap-4 px-7 pt-6 pb-8">
          <div className="seg w-full">
            <Link href="/login" className="seg-opt flex-1 justify-center">
              Log in
            </Link>
            <Link href="/signup" aria-current="page" className="seg-opt flex-1 justify-center">
              Sign up
            </Link>
          </div>

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

            <div className="field">
              <label htmlFor="password">Password</label>
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
              <label htmlFor="confirmPassword">Confirm password</label>
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
              {pending ? 'Creating account…' : 'Continue'}
            </button>
          </form>

          <p className="text-center text-[11px] leading-relaxed text-muted">
            Works with mobile wallets, banks, cards and cash — one login, every currency.
          </p>

          <p className="text-center text-[11px] text-muted">
            <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
