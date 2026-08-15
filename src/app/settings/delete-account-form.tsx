'use client'

import { useActionState, useState } from 'react'
import { deleteMyAccount, type DeleteMyAccountFormState } from './actions'

const initialState: DeleteMyAccountFormState = { error: null }

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteMyAccount, initialState)
  const [confirmation, setConfirmation] = useState('')

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="field">
        <label htmlFor="confirmation">
          Type <span className="font-semibold text-(--color-negative)">DELETE</span> to confirm
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="input"
        />
      </div>

      {state.error && (
        <p className="text-sm text-(--color-negative)" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || confirmation !== 'DELETE'}
        className="btn btn-block border-(--color-negative) text-(--color-negative)"
      >
        {pending ? 'Deleting…' : 'Delete my account permanently'}
      </button>
    </form>
  )
}
