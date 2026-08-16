'use client'

import { useActionState, useMemo, useState } from 'react'
import { createTransaction, updateTransaction, type TransactionFormState } from './actions'
import { todayIsoDate, type Category, type TransactionAccount } from '@/lib/transactions'
import { parseTransactionText } from '@/lib/sms-parser'

const initialState: TransactionFormState = { error: null }

export type EditableTransaction = {
  id: string
  direction: 'in' | 'out'
  amount: number
  note: string | null
  counterparty: string | null
  fee_amount: number | null
  occurred_on: string
  account_id: string
  category_id: string | null
}

export function TransactionForm({
  accounts,
  categories,
  transaction,
}: {
  accounts: TransactionAccount[]
  categories: Category[]
  transaction?: EditableTransaction
}) {
  const [state, formAction, pending] = useActionState(
    transaction ? updateTransaction : createTransaction,
    initialState
  )
  const [direction, setDirection] = useState<'in' | 'out'>(transaction?.direction ?? 'out')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [counterparty, setCounterparty] = useState(transaction?.counterparty ?? '')
  const [feeAmount, setFeeAmount] = useState(
    transaction?.fee_amount != null ? String(transaction.fee_amount) : ''
  )
  const [accountId, setAccountId] = useState(transaction?.account_id ?? accounts[0]?.id ?? '')

  const [showPaste, setShowPaste] = useState(false)
  const [smsText, setSmsText] = useState('')
  const [parseFeedback, setParseFeedback] = useState<string | null>(null)

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => c.kind === (direction === 'in' ? 'income' : 'expense')),
    [categories, direction]
  )
  const [categoryId, setCategoryId] = useState(
    transaction?.category_id ?? filteredCategories[0]?.id ?? ''
  )

  function handleDirectionChange(next: 'in' | 'out') {
    setDirection(next)
    const nextCategories = categories.filter(
      (c) => c.kind === (next === 'in' ? 'income' : 'expense')
    )
    setCategoryId(nextCategories[0]?.id ?? '')
  }

  const selectedAccount = accounts.find((a) => a.id === accountId)

  function handleParse() {
    const result = parseTransactionText(smsText)

    if (result.amount === null && result.direction === null) {
      setParseFeedback("Couldn't detect an amount or direction — fill in manually below.")
      return
    }

    if (result.direction) handleDirectionChange(result.direction)
    if (result.amount !== null) setAmount(String(result.amount))
    if (result.counterparty) setCounterparty(result.counterparty)
    if (result.feeAmount !== null) setFeeAmount(String(result.feeAmount))

    const parts = [
      result.amount !== null ? `amount ${result.amount}` : null,
      result.direction ? (result.direction === 'in' ? 'money in' : 'money out') : null,
      result.feeAmount !== null ? `fee ${result.feeAmount}` : null,
      result.provider ? `via ${result.provider}` : null,
    ].filter(Boolean)
    setParseFeedback(`Detected ${parts.join(' · ')} — double-check before saving.`)
  }

  return (
    <div className="flex flex-col gap-4.5">
      {!transaction && (
        <div className="flex flex-col gap-2 border-t border-(--color-divider) pt-3.5">
          <button
            type="button"
            onClick={() => setShowPaste((v) => !v)}
            className="self-start text-xs text-muted"
          >
            {showPaste ? '− Paste SMS or notification' : '+ Paste SMS or notification (optional)'}
          </button>

          {showPaste && (
            <div className="flex flex-col gap-2">
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={3}
                placeholder="Paste a mobile money confirmation message here…"
                className="input font-mono text-[11.5px]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">
                  We&apos;ll prefill the amount and direction — you confirm the rest.
                </span>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!smsText.trim()}
                  className="btn btn-ghost flex-none disabled:opacity-45"
                >
                  Parse
                </button>
              </div>
              {parseFeedback && <p className="text-[11px] text-muted">{parseFeedback}</p>}
            </div>
          )}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4.5">
        {transaction && <input type="hidden" name="id" value={transaction.id} />}
        <div className="seg w-full">
          <label className="seg-opt flex-1 justify-center gap-1.5">
            <input
              type="radio"
              checked={direction === 'in'}
              onChange={() => handleDirectionChange('in')}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
            <span>Money in</span>
          </label>
          <label className="seg-opt flex-1 justify-center gap-1.5">
            <input
              type="radio"
              checked={direction === 'out'}
              onChange={() => handleDirectionChange('out')}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
            <span>Money out</span>
          </label>
        </div>
        <input type="hidden" name="direction" value={direction} />

        <div className="field">
          <label htmlFor="accountId">Account</label>
          <select
            id="accountId"
            name="accountId"
            required
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="input"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.currency}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount</label>
          <div className="flex items-baseline gap-2 rounded-(--radius-md) border border-(--color-divider) px-3 py-2.5">
            <span className="text-[13px] text-muted">{selectedAccount?.currency ?? ''}</span>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-0 bg-transparent font-(family-name:--font-heading) text-[26px] font-semibold text-(--color-text) outline-none [font-variant-numeric:tabular-nums]"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="feeAmount">
            Fee <span className="text-muted">(optional)</span>
          </label>
          <input
            id="feeAmount"
            name="feeAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            className="input"
          />
          <p className="mt-1 text-[11px] text-muted">
            If this transaction had a mobile money fee, log it here instead of as a separate
            transaction.
          </p>
        </div>

        <div className="field">
          <label htmlFor="occurredOn">Date</label>
          <input
            id="occurredOn"
            name="occurredOn"
            type="date"
            required
            defaultValue={transaction?.occurred_on ?? todayIsoDate()}
            className="input"
          />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`tag ${c.id === categoryId ? 'tag-accent' : 'tag-outline'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <input type="hidden" name="categoryId" value={categoryId} />
        </div>

        <div className="field">
          <label htmlFor="counterparty">
            From / to <span className="text-muted">(optional)</span>
          </label>
          <input
            id="counterparty"
            name="counterparty"
            type="text"
            placeholder="e.g. JOHN KAMAU"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="note">
            Note <span className="text-muted">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="e.g. Weekly groceries"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
          />
        </div>

        {state.error && (
          <p className="text-sm text-(--color-negative)" role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary btn-block">
          {pending
            ? 'Saving…'
            : transaction
              ? 'Save changes'
              : 'Save entry'}
        </button>
      </form>
    </div>
  )
}
