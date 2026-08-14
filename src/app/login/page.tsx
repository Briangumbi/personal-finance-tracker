'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, type AuthFormState } from './actions'
import { ChitMark } from '@/components/chit-mark'

const initialState: AuthFormState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-4">
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) shadow-(--shadow-lg)"
      >
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-7 pt-10 pb-7">
          <ChitMark size="sm" />
          <h2 className="mt-2.5">Chit</h2>
          <p className="text-center text-xs text-muted">Track money everywhere it lives.</p>
        </div>

        <div className="flex flex-col gap-4 px-7 pt-6 pb-8">
          <div className="seg w-full">
            <Link href="/login" aria-current="page" className="seg-opt flex-1 justify-center">
              Log in
            </Link>
            <Link href="/signup" className="seg-opt flex-1 justify-center">
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
                autoComplete="current-password"
                className="input"
              />
            </div>

            {state.error && (
              <p className="text-sm text-(--color-negative)" role="alert">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block">
              {pending ? 'Logging in…' : 'Continue'}
            </button>
          </form>

          <p className="text-center text-[11px] leading-relaxed text-muted">
            Works with mobile wallets, banks, cards and cash — one login, every currency.
          </p>
        </div>
      </div>
    </div>
  )
}
