import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { accountTypeLabel, type Account } from '@/lib/accounts'
import { deleteAccount } from './actions'
import { AddAccountToggle } from './add-account-toggle'

function formatBalance(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, type, provider, currency, starting_balance, created_at')
    .order('created_at', { ascending: true })
    .returns<Account[]>()

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader email={user.email ?? ''} active="/accounts" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Accounts</h1>
          <p className="text-sm text-neutral-500">
            Every place you hold money — bank, card, mobile money, or cash.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            Couldn&apos;t load accounts: {error.message}
          </p>
        )}

        {accounts && accounts.length > 0 && (
          <ul className="space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {account.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {accountTypeLabel(account.type)}
                    {account.provider ? ` · ${account.provider}` : ''}
                    {' · '}
                    {account.currency}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatBalance(account.starting_balance, account.currency)}
                  </span>
                  <form action={deleteAccount}>
                    <input type="hidden" name="id" value={account.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${account.name}`}
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

        <AddAccountToggle
          key={accounts?.length ?? 0}
          defaultOpen={!accounts || accounts.length === 0}
        />
      </div>
    </div>
  )
}
