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
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see middleware.ts for details) — claims.email matches user.email.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  let transactionsQuery = supabase
    .from('transactions')
    .select(
      'id, direction, amount, currency, note, counterparty, fee_amount, occurred_on, accounts (name), categories (name)'
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
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader email={user.email ?? ''} active="/transactions" />

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Transactions</h2>
          <p className="text-sm text-muted">
            Log money moving in or out of any of your accounts.
          </p>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="rounded-(--radius-md) border border-(--color-divider) p-4.5">
            <TransactionForm accounts={accounts} categories={categories ?? []} />
          </div>
        ) : (
          <div className="rounded-(--radius-md) border border-dashed border-(--color-divider) p-6 text-center">
            <p className="text-sm text-muted">
              You need an account before you can log a transaction.
            </p>
            <Link href="/accounts" className="btn btn-ghost mt-2">
              Add your first account →
            </Link>
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <form method="GET" className="flex flex-wrap items-end gap-3 rounded-(--radius-md) border border-(--color-divider) p-4">
            <div className="field">
              <label htmlFor="accountId">Account</label>
              <select id="accountId" name="accountId" defaultValue={accountFilter ?? ''} className="input">
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="categoryId">Category</label>
              <select id="categoryId" name="categoryId" defaultValue={categoryFilter ?? ''} className="input">
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

            <div className="field">
              <label htmlFor="from">From</label>
              <input id="from" name="from" type="date" defaultValue={fromFilter ?? ''} className="input" />
            </div>

            <div className="field">
              <label htmlFor="to">To</label>
              <input id="to" name="to" type="date" defaultValue={toFilter ?? ''} className="input" />
            </div>

            <button type="submit" className="btn btn-primary">
              Filter
            </button>
            {hasFilters && (
              <Link href="/transactions" className="btn btn-ghost">
                Clear
              </Link>
            )}
          </form>
        )}

        {error && (
          <p className="text-sm text-(--color-negative)" role="alert">
            Couldn&apos;t load transactions: {error.message}
          </p>
        )}

        {transactions && transactions.length > 0 ? (
          <ul className="flex flex-col">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-3 border-b border-(--color-divider) py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[13px]">
                    {t.categories?.name ?? 'Uncategorized'}
                    {t.counterparty ? ` · ${t.counterparty}` : ''}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                  <p className="text-[11px] text-muted">
                    {t.accounts?.name ?? 'Unknown account'} · {formatDate(t.occurred_on)}
                  </p>
                  {t.fee_amount != null && (
                    <p className="text-[11px] text-muted">
                      Fee: {formatCurrency(t.fee_amount, t.currency)}
                    </p>
                  )}
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span
                    className={`whitespace-nowrap text-[13px] [font-variant-numeric:tabular-nums] ${
                      t.direction === 'out' ? 'text-(--color-negative)' : ''
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
                      className="text-[11px] text-muted hover:text-(--color-negative)"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : hasFilters ? (
          <p className="rounded-(--radius-md) border border-dashed border-(--color-divider) p-6 text-center text-sm text-muted">
            No transactions match these filters.
          </p>
        ) : (
          accounts &&
          accounts.length > 0 && (
            <p className="rounded-(--radius-md) border border-dashed border-(--color-divider) p-6 text-center text-sm text-muted">
              No transactions yet — add your first one above.
            </p>
          )
        )}
      </div>
    </div>
  )
}
