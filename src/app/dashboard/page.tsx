import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AccountIcon } from '@/components/account-icon'
import { BalanceRing } from '@/components/balance-ring'
import type { AccountType } from '@/lib/accounts'
import { formatCurrency } from '@/lib/currency'
import { BASE_CURRENCY, convertToBase, getExchangeRates } from '@/lib/fx'

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
      <div className="min-h-screen bg-(--color-bg)">
        <AppHeader email={user.email ?? ''} active="/dashboard" />
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
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader email={user.email ?? ''} active="/dashboard" />

      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex flex-col items-center gap-1.5 border-b border-(--color-divider) px-5 pt-7 pb-5">
          <BalanceRing>
            <span className="text-[10px] tracking-[0.12em] uppercase text-(--color-accent-700)">
              Total balance
            </span>
            {total ? (
              <span className="font-(family-name:--font-heading) text-[30px] font-semibold [font-variant-numeric:tabular-nums]">
                {formatCurrency(total.amount, total.currency)}
              </span>
            ) : (
              <span className="font-(family-name:--font-heading) text-[26px] font-semibold opacity-40">
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

        <div className="px-5 py-5">
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
      </div>
    </div>
  )
}
