import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import type { Category, Transaction, TransactionAccount } from '@/lib/transactions'
import { deleteTransaction } from './actions'
import { TransactionForm } from './transaction-form'

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
      supabase
        .from('transactions')
        .select(
          'id, direction, amount, currency, note, occurred_on, accounts (name), categories (name)'
        )
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .returns<Transaction[]>(),
    ])

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

        {error && (
          <p className="text-sm text-red-600" role="alert">
            Couldn&apos;t load transactions: {error.message}
          </p>
        )}

        {transactions && transactions.length > 0 && (
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
                    {formatAmount(t.amount, t.currency)}
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
        )}
      </div>
    </div>
  )
}
