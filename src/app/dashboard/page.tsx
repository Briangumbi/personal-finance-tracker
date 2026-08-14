import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { count: accountCount } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader email={user.email ?? ''} active="/dashboard" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Accounts</p>
          <p className="text-base font-medium text-neutral-900">
            {accountCount ?? 0} connected
          </p>
          <Link
            href="/accounts"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline"
          >
            {accountCount ? 'Manage accounts' : 'Add your first account'} →
          </Link>
        </div>

        <p className="text-sm text-neutral-500">
          Transaction entry and balance totals come next.
        </p>
      </div>
    </div>
  )
}
