import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import type { Account } from '@/lib/accounts'
import { getDisplayName } from '@/lib/profile'
import { AccountForm } from '../../account-form'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditAccountPage(props: PageProps<'/accounts/[id]/edit'>) {
  const { id } = await props.params

  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const displayName = await getDisplayName(supabase, user)

  // A malformed id or one that doesn't exist / isn't owned by this user
  // (RLS already scopes the SELECT) both end up here with no row — just
  // bounce back to the list rather than showing an error page.
  if (!UUID_RE.test(id)) {
    redirect('/accounts')
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, type, provider, currency, starting_balance, created_at')
    .eq('id', id)
    .single()
    .returns<Account>()

  if (!account) {
    redirect('/accounts')
  }

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader displayName={displayName} active="/accounts" />

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Edit account</h2>
          <p className="text-sm text-muted">Update the details below and save your changes.</p>
        </div>

        <div className="rounded-(--radius-md) border border-(--color-divider) p-4.5">
          <AccountForm account={account} />
        </div>
      </div>
    </div>
  )
}
