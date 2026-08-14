'use client'

import { useActionState, useState } from 'react'
import { createAccount, type AccountFormState } from './actions'
import { ACCOUNT_TYPES, CURRENCIES, MOBILE_MONEY_PROVIDERS } from '@/lib/accounts'

const initialState: AccountFormState = { error: null }

export function AccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState)
  const [type, setType] = useState<string>('bank')
  const [provider, setProvider] = useState<string>(MOBILE_MONEY_PROVIDERS[0])
  const [currency, setCurrency] = useState<string>(CURRENCIES[0])

  const isMobileMoney = type === 'mobile_money'
  const isOtherProvider = provider === 'Other'
  const isOtherCurrency = currency === 'Other'

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          Account name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Everyday M-Pesa, NBC Checking"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium text-neutral-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isMobileMoney && (
        <div className="space-y-1">
          <label htmlFor="provider" className="text-sm font-medium text-neutral-700">
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {MOBILE_MONEY_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {isOtherProvider && (
            <input
              name="providerOther"
              type="text"
              required
              placeholder="Provider name"
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="currency" className="text-sm font-medium text-neutral-700">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {isOtherCurrency && (
            <input
              name="currencyOther"
              type="text"
              required
              maxLength={3}
              placeholder="e.g. XOF"
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase outline-none focus:border-neutral-500"
            />
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="startingBalance"
            className="text-sm font-medium text-neutral-700"
          >
            Starting balance
          </label>
          <input
            id="startingBalance"
            name="startingBalance"
            type="number"
            step="0.01"
            defaultValue="0"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? 'Adding account…' : 'Add account'}
      </button>
    </form>
  )
}
