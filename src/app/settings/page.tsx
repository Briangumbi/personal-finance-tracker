import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { getDisplayName } from '@/lib/profile'
import { DeleteAccountForm } from './delete-account-form'
import { UsernameForm } from './username-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details) — claims.email matches
  // user.email.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const displayName = await getDisplayName(supabase, user)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.sub)
    .single()

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <AppHeader displayName={displayName} active="/settings" />

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div>
          <h2>Settings</h2>
          <p className="text-sm text-muted">Signed in as {user.email}</p>
        </div>

        <div className="rounded-(--radius-md) border border-(--color-divider) p-4.5">
          <UsernameForm currentUsername={profile?.username ?? null} />
        </div>

        <div className="flex flex-col gap-3.5 rounded-(--radius-md) border border-(--color-negative) p-4.5">
          <div>
            <h6 className="mb-1 text-(--color-negative)">Danger zone</h6>
            <p className="text-sm text-muted">
              Deleting your account permanently removes every account, transaction, and budget
              you&apos;ve added. This can&apos;t be undone.
            </p>
          </div>
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  )
}
