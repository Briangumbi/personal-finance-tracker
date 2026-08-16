'use client'

import { useActionState, useMemo, useState } from 'react'
import { createAccount, updateAccount, type AccountFormState } from './actions'
import { ACCOUNT_TYPES, CURRENCIES, type Account } from '@/lib/accounts'
import type { BankProvider } from '@/lib/bank-providers'

const initialState: AccountFormState = { error: null }

const PROVIDER_TYPE_ORDER = ['bank', 'mobile_money', 'card_network'] as const
const PROVIDER_TYPE_LABELS: Record<BankProvider['provider_type'], string> = {
  bank: 'Banks',
  mobile_money: 'Mobile Money',
  card_network: 'Card Networks',
}

export function AccountForm({
  account,
  providers,
}: {
  account?: Account
  providers: BankProvider[]
}) {
  const [state, formAction, pending] = useActionState(
    account ? updateAccount : createAccount,
    initialState
  )
  const [type, setType] = useState<string>(account?.type ?? 'bank')

  const hasCountryProviders = providers.length > 0
  const knownProviderNames = useMemo(
    () => new Set(providers.map((p) => p.provider_name)),
    [providers]
  )
  const groupedProviders = useMemo(() => {
    const groups: Record<BankProvider['provider_type'], BankProvider[]> = {
      bank: [],
      mobile_money: [],
      card_network: [],
    }
    for (const p of providers) groups[p.provider_type].push(p)
    return groups
  }, [providers])

  // Country-suggested dropdown: preselects a known provider, falls back to
  // "Other" if the account has a provider that isn't in the list, or blank
  // if there's nothing to preselect yet. No country data at all: this
  // holds the plain free-text value instead, no dropdown involved.
  const [provider, setProvider] = useState<string>(() => {
    if (!hasCountryProviders) return account?.provider ?? ''
    if (account?.provider && knownProviderNames.has(account.provider)) return account.provider
    if (account?.provider) return 'Other'
    return ''
  })

  const [currency, setCurrency] = useState<string>(
    (CURRENCIES as readonly string[]).includes(account?.currency ?? '')
      ? (account?.currency as string)
      : account?.currency
        ? 'Other'
        : CURRENCIES[0]
  )

  // Provider is relevant for bank/card/mobile_money, not cash/other. Only
  // mobile_money requires one — bank/card can leave it blank.
  const showProviderField = type === 'bank' || type === 'card' || type === 'mobile_money'
  const providerRequired = type === 'mobile_money'
  const isOtherProvider = hasCountryProviders && provider === 'Other'
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

      {showProviderField && (
        <div className="field">
          <label htmlFor="provider">
            Provider{' '}
            {!providerRequired && <span className="text-muted">(optional)</span>}
          </label>
          {hasCountryProviders ? (
            <>
              <select
                id="provider"
                name="provider"
                required={providerRequired}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input"
              >
                <option value="" disabled>
                  Select a provider
                </option>
                {PROVIDER_TYPE_ORDER.map((t) =>
                  groupedProviders[t].length > 0 ? (
                    <optgroup key={t} label={PROVIDER_TYPE_LABELS[t]}>
                      {groupedProviders[t].map((p) => (
                        <option key={p.id} value={p.provider_name}>
                          {p.provider_name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
                <option value="Other">Other</option>
              </select>
              {isOtherProvider && (
                <input
                  name="providerOther"
                  type="text"
                  required
                  defaultValue={
                    account?.provider && !knownProviderNames.has(account.provider)
                      ? account.provider
                      : undefined
                  }
                  placeholder="Provider name"
                  className="input mt-2"
                />
              )}
            </>
          ) : (
            <input
              id="provider"
              name="provider"
              type="text"
              required={providerRequired}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. CRDB, Chase, M-Pesa"
              className="input"
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
