import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AccountIcon } from '@/components/account-icon'
import { ACCOUNT_TYPES, accountTypeLabel, type Account } from '@/lib/accounts'
import { formatCurrency } from '@/lib/currency'
import { getDisplayName } from '@/lib/profile'
import { deleteAccount } from './actions'
import { AddAccountToggle } from './add-account-toggle'

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(isoDate)
  )
}

export default async function AccountsPage() {
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

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, type, provider, currency, starting_balance, created_at')
    .order('created_at', { ascending: true })
    .returns<Account[]>()

  const groups = ACCOUNT_TYPES.map((t) => ({
    type: t.value,
    label: t.value === 'mobile_money' ? 'Mobile money' : t.label,
    accounts: (accounts ?? []).filter((a) => a.type === t.value),
  })).filter((g) => g.accounts.length > 0)

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader displayName={displayName} active="/accounts" />

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Accounts</h2>
          <p className="text-sm text-muted">
            Every place you hold money — bank, card, mobile money, or cash.
          </p>
        </div>

        {error && (
          <p className="text-sm text-(--color-negative)" role="alert">
            Couldn&apos;t load accounts: {error.message}
          </p>
        )}

        {groups.map((group) => (
          <div key={group.type} className="flex flex-col gap-2.5">
            <h6 className="opacity-60">{group.label}</h6>
            {group.accounts.map((account) => {
              const isDebt = account.type === 'card' && account.starting_balance < 0
              return (
                <div key={account.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="card-kicker">
                        {account.provider ?? accountTypeLabel(account.type)}
                      </div>
                      <div className="card-title">{account.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AccountIcon type={account.type} size={20} className="text-(--color-accent-700)" />
                      <Link
                        href={`/accounts/${account.id}/edit`}
                        className="text-[11px] text-muted hover:text-(--color-text)"
                      >
                        Edit
                      </Link>
                      <form action={deleteAccount}>
                        <input type="hidden" name="id" value={account.id} />
                        <button
                          type="submit"
                          aria-label={`Delete ${account.name}`}
                          className="text-[11px] text-muted hover:text-(--color-negative)"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <p
                    className={`card-body font-(family-name:--font-heading) text-base font-semibold opacity-100 [font-variant-numeric:tabular-nums] ${
                      account.starting_balance < 0 ? 'text-(--color-negative)' : ''
                    }`}
                  >
                    {formatCurrency(account.starting_balance, account.currency)}
                    {isDebt && (
                      <span className="ml-1.5 font-(family-name:--font-body) text-[11px] font-normal text-(--color-text) opacity-70">
                        owed
                      </span>
                    )}
                  </p>
                  <div className="card-meta">
                    <span>{account.currency}</span>
                    <span>&middot;</span>
                    <span>Added {formatDate(account.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {!error && accounts && accounts.length === 0 && (
          <p className="rounded-(--radius-md) border border-dashed border-(--color-divider) p-6 text-center text-sm text-muted">
            No accounts yet — add your first one below.
          </p>
        )}

        <AddAccountToggle
          key={accounts?.length ?? 0}
          defaultOpen={!accounts || accounts.length === 0}
        />
      </div>
    </div>
  )
}
