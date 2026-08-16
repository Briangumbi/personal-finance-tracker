import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AccountIcon } from '@/components/account-icon'
import { BalanceRing, balanceTextSizeClass } from '@/components/balance-ring'
import { PrivateBalance } from '@/components/private-balance'
import type { AccountType } from '@/lib/accounts'
import { formatCurrency } from '@/lib/currency'
import { getDisplayName } from '@/lib/profile'
import { BASE_CURRENCY, convertToBase, getExchangeRates } from '@/lib/fx'
import { getCategorySpendThisMonth } from '@/lib/spend'

type AccountRow = {
  id: string
  name: string
  type: AccountType
  provider: string | null
  currency: string
  starting_balance: number
}

type BalanceTxnRow = {
  account_id: string
  direction: 'in' | 'out'
  amount: number
  fee_amount: number | null
}

type TrendTxnRow = {
  occurred_on: string
  amount: number
  currency: string
}

type BudgetRow = {
  id: string
  limit_amount: number
  categories: { name: string } | null
}

function monthsAgoFirstOfMonthIso(monthsBack: number) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see middleware.ts for details) — claims.email matches user.email.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const displayName = await getDisplayName(supabase, user)

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, provider, currency, starting_balance')
    .order('created_at', { ascending: true })
    .returns<AccountRow[]>()

  if (!accounts || accounts.length === 0) {
    return (
      <div className="min-h-screen bg-(--color-bg)">
        <AppHeader displayName={displayName} active="/dashboard" />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="flex flex-col items-center gap-2.5 rounded-(--radius-lg) border border-(--color-divider) bg-(--color-surface) px-6 py-10 text-center">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="opacity-50"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            <h4 className="mt-1">No accounts yet</h4>
            <p className="max-w-[260px] text-xs text-muted">
              Add your first mobile wallet, bank account or card to see where your money sits.
            </p>
            <Link href="/accounts" className="btn btn-primary mt-1.5">
              Add account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // These four reads are independent of each other — none depends on
  // another's result — so they're batched into one round trip instead of
  // four sequential ones, matching the pattern already used on the
  // transactions and budgets pages.
  const [
    { data: balanceTxns },
    categorySpend,
    { data: budgets },
    { data: trendTxns },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('account_id, direction, amount, fee_amount')
      .returns<BalanceTxnRow[]>(),
    getCategorySpendThisMonth(supabase),
    supabase
      .from('budgets')
      .select('id, limit_amount, categories (name)')
      .eq('period', 'monthly')
      .returns<BudgetRow[]>(),
    supabase
      .from('transactions')
      .select('occurred_on, amount, currency')
      .eq('direction', 'out')
      .gte('occurred_on', monthsAgoFirstOfMonthIso(5))
      .returns<TrendTxnRow[]>(),
  ])
  const { spendByCategory, currencyLabel: spendCurrencyLabel, skipped: spendSkipped } = categorySpend

  const netByAccount = new Map<string, number>()
  for (const t of balanceTxns ?? []) {
    const delta = t.direction === 'in' ? t.amount : -t.amount
    // A fee is always a cost taken from the wallet, regardless of whether
    // the parent transaction was money in or out.
    const feeDelta = -(t.fee_amount ?? 0)
    netByAccount.set(t.account_id, (netByAccount.get(t.account_id) ?? 0) + delta + feeDelta)
  }

  const accountBalances = accounts.map((a) => ({
    ...a,
    balance: a.starting_balance + (netByAccount.get(a.id) ?? 0),
  }))

  // "Total balance" is a net-worth figure, so cards (a liability — what's
  // owed, not held) are excluded; everything else (bank, mobile money,
  // cash, other) counts as an asset. Cards still show in the per-account
  // list below, balance and all.
  const assetAccounts = accountBalances.filter((a) => a.type !== 'card')

  // Only convert to a base currency when more than one currency is
  // actually in use among asset accounts — a single-currency user never
  // needs the FX call.
  const distinctCurrencies = new Set(assetAccounts.map((a) => a.currency))
  let total: { amount: number; currency: string; unconverted: number } | null = null

  if (distinctCurrencies.size === 0) {
    total = { amount: 0, currency: BASE_CURRENCY, unconverted: 0 }
  } else if (distinctCurrencies.size === 1) {
    const [currency] = distinctCurrencies
    total = {
      amount: assetAccounts.reduce((sum, a) => sum + a.balance, 0),
      currency,
      unconverted: 0,
    }
  } else {
    const rates = await getExchangeRates()
    if (rates) {
      let sum = 0
      let unconverted = 0
      for (const a of assetAccounts) {
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

  const spendRows = Object.entries(spendByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  const maxSpend = spendRows[0]?.amount ?? 0

  // Budget alerts — reads from the spendByCategory object already built
  // above, never recomputes or forks it. Only "monthly" budgets exist
  // today, and spendByCategory is already scoped to the current month, so
  // no extra date filtering is needed here.
  const budgetAlerts = (budgets ?? [])
    .filter((b) => b.categories)
    .map((b) => {
      const spent = spendByCategory[b.categories!.name] ?? 0
      return {
        id: b.id,
        categoryName: b.categories!.name,
        limit: b.limit_amount,
        spent,
        percent: b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0,
      }
    })
    .filter((b) => b.percent >= 80)
    .sort((a, b) => b.percent - a.percent)

  // Spend trend — last 6 months, same "out only" scope as spend-by-category,
  // just grouped by month instead of category.
  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const trendCurrencies = new Set((trendTxns ?? []).map((t) => t.currency))
  const trendNeedsConversion = trendCurrencies.size > 1
  const trendRates = trendNeedsConversion ? await getExchangeRates() : null

  const spendByMonth = new Map<string, number>()
  let trendSkipped = 0
  for (const t of trendTxns ?? []) {
    const key = t.occurred_on.slice(0, 7)
    const value = trendNeedsConversion
      ? trendRates
        ? convertToBase(t.amount, t.currency, trendRates)
        : null
      : t.amount
    if (value === null) {
      trendSkipped += 1
      continue
    }
    spendByMonth.set(key, (spendByMonth.get(key) ?? 0) + value)
  }

  const trendRows = trendMonths.map((key) => ({
    key,
    label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
      new Date(`${key}-01T00:00:00`)
    ),
    amount: spendByMonth.get(key) ?? 0,
  }))
  const maxTrend = Math.max(...trendRows.map((r) => r.amount), 0)
  const trendCurrencyLabel = trendNeedsConversion
    ? BASE_CURRENCY
    : ([...trendCurrencies][0] ?? BASE_CURRENCY)

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader displayName={displayName} active="/dashboard" />

      <div className="mx-auto flex max-w-2xl flex-col">
        {budgetAlerts.length > 0 && (
          <div className="border-b border-(--color-divider) bg-(--color-surface) px-5 py-4">
            <h6 className="mb-2 opacity-60">Budget alerts</h6>
            <ul className="flex flex-col gap-1.5">
              {budgetAlerts.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-[13px]">
                  <span>
                    {b.categoryName}
                    <span className="ml-1.5 text-(--color-negative)">
                      {b.percent >= 100 ? 'over budget' : 'near budget'}
                    </span>
                  </span>
                  <span className="text-(--color-negative) [font-variant-numeric:tabular-nums]">
                    {formatCurrency(b.spent, spendCurrencyLabel)} / {formatCurrency(b.limit, spendCurrencyLabel)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-5 pt-7 pb-5">
          <BalanceRing>
            <span className="text-[10px] tracking-[0.12em] uppercase text-(--color-accent-700)">
              Total balance
            </span>
            {total ? (
              <PrivateBalance
                formatted={formatCurrency(total.amount, total.currency)}
                className={`font-(family-name:--font-heading) font-semibold leading-none [font-variant-numeric:tabular-nums] ${balanceTextSizeClass(
                  formatCurrency(total.amount, total.currency)
                )}`}
              />
            ) : (
              <span className="font-(family-name:--font-heading) text-[26px] font-semibold leading-none opacity-40">
                &mdash;
              </span>
            )}
            <span className="text-[10px] text-muted">
              {assetAccounts.length} asset account{assetAccounts.length === 1 ? '' : 's'}
            </span>
          </BalanceRing>
          <p className="mt-2 text-[11px] text-muted">
            {total === null
              ? "Exchange rates are unavailable, so we can't total your currencies right now."
              : distinctCurrencies.size > 1
                ? `Converted to ${BASE_CURRENCY} at today's rates${
                    total.unconverted > 0
                      ? ` · ${total.unconverted} account${total.unconverted > 1 ? 's' : ''} not included`
                      : ''
                  }`
                : 'Across your asset accounts'}
          </p>
        </div>

        <div className="border-b border-(--color-divider) px-5 py-5">
          <h6 className="mb-3.5 opacity-60">Accounts</h6>
          <div className="flex flex-col gap-1">
            {accountBalances.map((a) => (
              <Link key={a.id} href={`/transactions?accountId=${a.id}`} className="ledger-row">
                <AccountIcon type={a.type} className="flex-none text-(--color-accent-700)" />
                <span className="whitespace-nowrap text-[13px]">{a.name}</span>
                <span className="leader" />
                <span
                  className={`whitespace-nowrap text-[13px] [font-variant-numeric:tabular-nums] ${
                    a.balance < 0 ? 'text-(--color-negative)' : ''
                  }`}
                >
                  {formatCurrency(a.balance, a.currency)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-b border-(--color-divider) px-5 py-5">
          <h6 className="mb-1 opacity-60">Spend this month</h6>
          {spendSkipped > 0 && (
            <p className="mb-2 text-[11px] text-muted">
              {spendSkipped} transaction{spendSkipped > 1 ? 's' : ''} not included (unsupported
              currency)
            </p>
          )}

          {spendRows.length === 0 ? (
            <p className="pt-2 text-sm text-muted">No spending recorded yet this month.</p>
          ) : (
            <div className="flex flex-col gap-2.5 pt-2">
              {spendRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{row.name}</span>
                    <span className="[font-variant-numeric:tabular-nums]">
                      {formatCurrency(row.amount, spendCurrencyLabel)}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full bg-(--color-divider)">
                    <div
                      className="h-full rounded-full bg-(--color-accent)"
                      style={{
                        width: `${maxSpend > 0 ? Math.max((row.amount / maxSpend) * 100, 4) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <h6 className="mb-1 opacity-60">Spend trend</h6>
          {maxTrend === 0 ? (
            <p className="pt-2 text-sm text-muted">No spending recorded in the last 6 months.</p>
          ) : (
            <>
              <p className="mb-3 text-[11px] text-muted">
                Last 6 months
                {trendNeedsConversion ? ` · converted to ${BASE_CURRENCY}` : ''}
                {trendSkipped > 0
                  ? ` · ${trendSkipped} transaction${trendSkipped > 1 ? 's' : ''} not included`
                  : ''}
              </p>
              <div className="flex h-24 items-end gap-2 border-b border-(--color-divider)">
                {trendRows.map((row) => (
                  <div key={row.key} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      className="mx-auto w-full max-w-6 rounded-t-[4px] bg-(--color-accent)"
                      style={{
                        height: `${
                          maxTrend > 0
                            ? Math.max((row.amount / maxTrend) * 100, row.amount > 0 ? 4 : 0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {trendRows.map((row) => (
                  <div key={row.key} className="flex-1 text-center">
                    <p className="text-[10px] text-muted">{row.label}</p>
                    <p className="text-[10px] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(row.amount, trendCurrencyLabel)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
