'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { updateUsername, type UsernameFormState } from './actions'

const initialState: UsernameFormState = { error: null }

export function UsernameForm({ currentUsername }: { currentUsername: string | null }) {
  const [state, formAction, pending] = useActionState(updateUsername, initialState)
  const [saved, setSaved] = useState(false)
  const wasPending = useRef(false)

  // No redirect on success (unlike signup), so signal a successful save
  // ourselves once a pending submission finishes with no error — same
  // wasPending-ref technique already used in budget-item.tsx.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setSaved(true)
    }
    wasPending.current = pending
  }, [pending, state.error])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="field flex-1">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            defaultValue={currentUsername ?? ''}
            onChange={() => setSaved(false)}
            placeholder="e.g. brian_g"
            className="input"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-(--color-negative)" role="alert">
          {state.error}
        </p>
      )}
      {saved && !state.error && <p className="text-sm text-muted">Saved.</p>}
    </form>
  )
}
