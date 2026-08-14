'use client'

import { useActionState, useMemo, useState } from 'react'
import { createTransaction, type TransactionFormState } from './actions'
import { todayIsoDate, type Category, type TransactionAccount } from '@/lib/transactions'
import { parseTransactionText } from '@/lib/sms-parser'

const initialState: TransactionFormState = { error: null }

export function TransactionForm({
  accounts,
  categories,
}: {
  accounts: TransactionAccount[]
  categories: Category[]
}) {
  const [state, formAction, pending] = useActionState(
    createTransaction,
    initialState
  )
  const [direction, setDirection] = useState<'in' | 'out'>('out')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const [showPaste, setShowPaste] = useState(false)
  const [smsText, setSmsText] = useState('')
  const [parseFeedback, setParseFeedback] = useState<string | null>(null)

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => c.kind === (direction === 'in' ? 'income' : 'expense')),
    [categories, direction]
  )

  function handleParse() {
    const result = parseTransactionText(smsText)

    if (result.amount === null && result.direction === null) {
      setParseFeedback("Couldn't detect an amount or direction — fill in manually below.")
      return
    }

    if (result.direction) setDirection(result.direction)
    if (result.amount !== null) setAmount(String(result.amount))
    if (result.note) setNote(result.note)

    const parts = [
      result.amount !== null ? `amount ${result.amount}` : null,
      result.direction ? (result.direction === 'in' ? 'money in' : 'money out') : null,
      result.provider ? `via ${result.provider}` : null,
    ].filter(Boolean)
    setParseFeedback(`Detected ${parts.join(' · ')} — double-check before saving.`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <button
          type="button"
          onClick={() => setShowPaste((v) => !v)}
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          {showPaste ? '− Paste from SMS/notification' : '+ Paste from SMS/notification'}
        </button>

        {showPaste && (
          <div className="mt-3 space-y-2">
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              rows={3}
              placeholder="Paste a mobile money confirmation message here…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={!smsText.trim()}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              Fill form from text
            </button>
            {parseFeedback && (
              <p className="text-xs text-neutral-500">{parseFeedback}</p>
            )}
          </div>
        )}
      </div>

      <form action={formAction} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('out')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === 'out'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Money out
          </button>
          <button
            type="button"
            onClick={() => setDirection('in')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === 'in'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Money in
          </button>
        </div>
        <input type="hidden" name="direction" value={direction} />

        <div className="space-y-1">
          <label htmlFor="accountId" className="text-sm font-medium text-neutral-700">
            Account
          </label>
          <select
            id="accountId"
            name="accountId"
            required
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="amount" className="text-sm font-medium text-neutral-700">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="occurredOn" className="text-sm font-medium text-neutral-700">
              Date
            </label>
            <input
              id="occurredOn"
              name="occurredOn"
              type="date"
              required
              defaultValue={todayIsoDate()}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="categoryId" className="text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="note" className="text-sm font-medium text-neutral-700">
            Note <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="e.g. Weekly groceries"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
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
          {pending ? 'Adding…' : 'Add transaction'}
        </button>
      </form>
    </div>
  )
}
