import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { accountTypeLabel } from '@/lib/accounts'
import { formatCurrency } from '@/lib/currency'
import { BASE_CURRENCY, convertToBase, getExchangeRates } from '@/lib/fx'

type AccountRow = {
  id: string
  name: string
  type: string
  provider: string | null
  currency: string
  starting_balance: number
}

type BalanceTxnRow = {
  account_id: string
  direction: 'in' | 'out'
  amount: number
}

type CategorySpendRow = {
  amount: number
  currency: string
  categories: { name: string } | null
}

function firstOfMonthIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, provider, currency, starting_balance')
    .order('created_at', { ascending: true })
    .returns<AccountRow[]>()

  if (!accounts || accounts.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader email={user.email ?? ''} active="/dashboard" />
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">
              Add an account to start seeing balances here.
            </p>
            <Link
              href="/accounts"
              className="mt-2 inline-block text-sm font-medium text-neutral-900 underline"
            >
              Add your first account →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: balanceTxns } = await supabase
    .from('transactions')
    .select('account_id, direction, amount')
    .returns<BalanceTxnRow[]>()

  const netByAccount = new Map<string, number>()
  for (const t of balanceTxns ?? []) {
    const delta = t.direction === 'in' ? t.amount : -t.amount
    netByAccount.set(t.account_id, (netByAccount.get(t.account_id) ?? 0) + delta)
  }

  const accountBalances = accounts.map((a) => ({
    ...a,
    balance: a.starting_balance + (netByAccount.get(a.id) ?? 0),
  }))

  // Only convert to a base currency when more than one currency is
  // actually in use — a single-currency user never needs the FX call.
  const distinctCurrencies = new Set(accounts.map((a) => a.currency))
  let total: { amount: number; currency: string; unconverted: number } | null = null

  if (distinctCurrencies.size <= 1) {
    const [currency] = distinctCurrencies
    total = {
      amount: accountBalances.reduce((sum, a) => sum + a.balance, 0),
      currency,
      unconverted: 0,
    }
  } else {
    const rates = await getExchangeRates()
    if (rates) {
      let sum = 0
      let unconverted = 0
      for (const a of accountBalances) {
        const converted = convertToBase(a.balance, a.currency, rates)
        if (converted === null) {
          unconverted += 1
        } else {
          sum += converted
        }
      }
      total = { amount: sum, currency: BASE_CURRENCY, unconverted }
    }
  }

  const { data: monthSpend } = await supabase
    .from('transactions')
    .select('amount, currency, categories (name)')
    .eq('direction', 'out')
    .gte('occurred_on', firstOfMonthIso())
    .returns<CategorySpendRow[]>()

  const spendCurrencies = new Set((monthSpend ?? []).map((t) => t.currency))
  const spendNeedsConversion = spendCurrencies.size > 1
  const spendRates = spendNeedsConversion ? await getExchangeRates() : null

  const spendByCategory = new Map<string, number>()
  let spendSkipped = 0
  for (const t of monthSpend ?? []) {
    const name = t.categories?.name ?? 'Uncategorized'
    const value = spendNeedsConversion
      ? spendRates
        ? convertToBase(t.amount, t.currency, spendRates)
        : null
      : t.amount
    if (value === null) {
      spendSkipped += 1
      continue
    }
    spendByCategory.set(name, (spendByCategory.get(name) ?? 0) + value)
  }

  const spendRows = [...spendByCategory.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  const maxSpend = spendRows[0]?.amount ?? 0
  const spendCurrencyLabel = spendNeedsConversion ? BASE_CURRENCY : [...spendCurrencies][0]

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader email={user.email ?? ''} active="/dashboard" />

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Total balance</p>
          {total ? (
            <>
              <p className="mt-1 text-4xl font-semibold text-neutral-900">
                {formatCurrency(total.amount, total.currency)}
              </p>
              {distinctCurrencies.size > 1 && (
                <p className="mt-1 text-xs text-neutral-400">
                  Converted to {BASE_CURRENCY} using daily exchange rates
                  {total.unconverted > 0
                    ? ` · ${total.unconverted} account${total.unconverted > 1 ? 's' : ''} not included (unsupported currency)`
                    : ''}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">
              Exchange rates are unavailable right now, so we can&apos;t combine
              your {distinctCurrencies.size} currencies into one total. See
              balances per account below.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Balance per account
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {accountBalances.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <p className="truncate text-sm font-medium text-neutral-900">
                  {a.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {accountTypeLabel(a.type)}
                  {a.provider ? ` · ${a.provider}` : ''}
                </p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {formatCurrency(a.balance, a.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">
            Spend by category
          </h2>
          <p className="mb-3 text-xs text-neutral-500">
            This month
            {spendNeedsConversion ? ` · converted to ${BASE_CURRENCY}` : ''}
            {spendSkipped > 0
              ? ` · ${spendSkipped} transaction${spendSkipped > 1 ? 's' : ''} not included (unsupported currency)`
              : ''}
          </p>

          {spendRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              No spending recorded yet this month.
            </p>
          ) : (
            <ul className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              {spendRows.map((row) => (
                <li key={row.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-neutral-700">
                    {row.name}
                  </span>
                  <span className="flex-1">
                    <span
                      className="block h-4 rounded-full bg-[#2a78d6]"
                      style={{
                        width: `${maxSpend > 0 ? Math.max((row.amount / maxSpend) * 100, 4) : 0}%`,
                      }}
                    />
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm font-medium text-neutral-900 [font-variant-numeric:tabular-nums]">
                    {formatCurrency(row.amount, spendCurrencyLabel)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
