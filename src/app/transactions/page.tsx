import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import type { Category, Transaction, TransactionAccount } from '@/lib/transactions'
import { formatCurrency } from '@/lib/currency'
import { deleteTransaction } from './actions'
import { TransactionForm } from './transaction-form'

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

// Guards against shape-valid but semantically invalid dates (e.g.
// "2026-13-99") reaching Postgres and surfacing a raw DB error — the round
// trip through Date catches anything the regex's digit-shape check misses.
function isValidIsoDate(value: string) {
  if (!DATE_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export default async function TransactionsPage(props: PageProps<'/transactions'>) {
  const params = await props.searchParams
  const accountId = firstParam(params.accountId)
  const categoryId = firstParam(params.categoryId)
  const from = firstParam(params.from)
  const to = firstParam(params.to)

  const accountFilter = accountId && UUID_RE.test(accountId) ? accountId : undefined
  const categoryFilter = categoryId && UUID_RE.test(categoryId) ? categoryId : undefined
  const fromFilter = from && isValidIsoDate(from) ? from : undefined
  const toFilter = to && isValidIsoDate(to) ? to : undefined
  const hasFilters = !!(accountFilter || categoryFilter || fromFilter || toFilter)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let transactionsQuery = supabase
    .from('transactions')
    .select(
      'id, direction, amount, currency, note, occurred_on, accounts (name), categories (name)'
    )
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (accountFilter) transactionsQuery = transactionsQuery.eq('account_id', accountFilter)
  if (categoryFilter) transactionsQuery = transactionsQuery.eq('category_id', categoryFilter)
  if (fromFilter) transactionsQuery = transactionsQuery.gte('occurred_on', fromFilter)
  if (toFilter) transactionsQuery = transactionsQuery.lte('occurred_on', toFilter)

  const [{ data: accounts }, { data: categories }, { data: transactions, error }] =
    await Promise.all([
      supabase
        .from('accounts')
        .select('id, name, currency')
        .order('created_at', { ascending: true })
        .returns<TransactionAccount[]>(),
      supabase
        .from('categories')
        .select('id, name, kind')
        .order('name', { ascending: true })
        .returns<Category[]>(),
      transactionsQuery.returns<Transaction[]>(),
    ])

  const incomeCategories = (categories ?? []).filter((c) => c.kind === 'income')
  const expenseCategories = (categories ?? []).filter((c) => c.kind === 'expense')

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader email={user.email ?? ''} active="/transactions" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Transactions</h1>
          <p className="text-sm text-neutral-500">
            Log money moving in or out of any of your accounts.
          </p>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <TransactionForm accounts={accounts} categories={categories ?? []} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">
              You need an account before you can log a transaction.
            </p>
            <Link
              href="/accounts"
              className="mt-2 inline-block text-sm font-medium text-neutral-900 underline"
            >
              Add your first account →
            </Link>
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <form
            method="GET"
            className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="space-y-1">
              <label htmlFor="accountId" className="text-xs font-medium text-neutral-700">
                Account
              </label>
              <select
                id="accountId"
                name="accountId"
                defaultValue={accountFilter ?? ''}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="categoryId" className="text-xs font-medium text-neutral-700">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={categoryFilter ?? ''}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
              >
                <option value="">All categories</option>
                <optgroup label="Income">
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Expense">
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="from" className="text-xs font-medium text-neutral-700">
                From
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={fromFilter ?? ''}
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="to" className="text-xs font-medium text-neutral-700">
                To
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={toFilter ?? ''}
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Filter
            </button>
            {hasFilters && (
              <Link
                href="/transactions"
                className="text-sm text-neutral-500 underline hover:text-neutral-900"
              >
                Clear
              </Link>
            )}
          </form>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            Couldn&apos;t load transactions: {error.message}
          </p>
        )}

        {transactions && transactions.length > 0 ? (
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {t.categories?.name ?? 'Uncategorized'}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {t.accounts?.name ?? 'Unknown account'} · {formatDate(t.occurred_on)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      t.direction === 'in' ? 'text-green-700' : 'text-neutral-900'
                    }`}
                  >
                    {t.direction === 'in' ? '+' : '−'}
                    {formatCurrency(t.amount, t.currency)}
                  </span>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      aria-label="Delete transaction"
                      className="text-xs text-neutral-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          hasFilters && (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              No transactions match these filters.
            </p>
          )
        )}
      </div>
    </div>
  )
}
