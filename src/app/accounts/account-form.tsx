'use client'

import { useActionState, useState } from 'react'
import { createAccount, updateAccount, type AccountFormState } from './actions'
import { ACCOUNT_TYPES, CURRENCIES, MOBILE_MONEY_PROVIDERS, type Account } from '@/lib/accounts'

const initialState: AccountFormState = { error: null }

export function AccountForm({ account }: { account?: Account }) {
  const [state, formAction, pending] = useActionState(
    account ? updateAccount : createAccount,
    initialState
  )
  const [type, setType] = useState<string>(account?.type ?? 'bank')
  const [provider, setProvider] = useState<string>(
    account?.provider && (MOBILE_MONEY_PROVIDERS as readonly string[]).includes(account.provider)
      ? account.provider
      : account?.provider
        ? 'Other'
        : MOBILE_MONEY_PROVIDERS[0]
  )
  const [currency, setCurrency] = useState<string>(
    (CURRENCIES as readonly string[]).includes(account?.currency ?? '')
      ? (account?.currency as string)
      : account?.currency
        ? 'Other'
        : CURRENCIES[0]
  )

  const isMobileMoney = type === 'mobile_money'
  const isOtherProvider = provider === 'Other'
  const isOtherCurrency = currency === 'Other'

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {account && <input type="hidden" name="id" value={account.id} />}
      <div className="field">
        <label htmlFor="name">Account name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={account?.name}
          placeholder="e.g. Everyday M-Pesa, NBC Checking"
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="type">Type</label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isMobileMoney && (
        <div className="field">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="input"
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
              defaultValue={
                account?.provider &&
                !(MOBILE_MONEY_PROVIDERS as readonly string[]).includes(account.provider)
                  ? account.provider
                  : undefined
              }
              placeholder="Provider name"
              className="input mt-2"
            />
          )}
        </div>
      )}

      <div className="flex gap-2.5">
        <div className="field flex-1">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
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
              defaultValue={
                account?.currency && !(CURRENCIES as readonly string[]).includes(account.currency)
                  ? account.currency
                  : undefined
              }
              placeholder="e.g. XOF"
              className="input mt-2 uppercase"
            />
          )}
        </div>

        <div className="field flex-1">
          <label htmlFor="startingBalance">Starting balance</label>
          <input
            id="startingBalance"
            name="startingBalance"
            type="number"
            step="0.01"
            defaultValue={account?.starting_balance ?? 0}
            className="input"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-(--color-negative)" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? 'Saving…' : account ? 'Save changes' : 'Save account'}
      </button>
    </form>
  )
}
