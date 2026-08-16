'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type DeleteMyAccountFormState = {
  error: string | null
}

export type UsernameFormState = {
  error: string | null
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export async function updateUsername(
  _prevState: UsernameFormState,
  formData: FormData
): Promise<UsernameFormState> {
  const username = String(formData.get('username') ?? '').trim()

  if (!USERNAME_RE.test(username)) {
    return {
      error: 'Username must be 3-20 characters: letters, numbers, or underscore.',
    }
  }

  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  // upsert (not update) so accounts that predate the username feature and
  // have no profile row yet can set one here too, not just correct an
  // existing one. Both the insert and update RLS policies on profiles check
  // auth.uid() = user_id, so this is covered under the regular RLS-scoped
  // client either way — no service-role client needed here, unlike signup,
  // since this request has a real session.
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.sub, username }, { onConflict: 'user_id' })

  if (error) {
    if (error.code === '23505') {
      return { error: 'That username is taken. Please choose another.' }
    }
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { error: null }
}

export async function deleteMyAccount(
  _prevState: DeleteMyAccountFormState,
  formData: FormData
): Promise<DeleteMyAccountFormState> {
  const confirmation = String(formData.get('confirmation') ?? '')
  if (confirmation !== 'DELETE') {
    return { error: 'Type DELETE (all caps) to confirm.' }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  // Calls the Auth Admin API with the service role key — deleting a user's
  // own account has no equivalent in the regular client SDK. `user.sub`
  // comes from this request's own verified session, never from form input,
  // so this can only ever delete the caller's own account. Every table
  // cascades from auth.users, so this also removes all of their accounts,
  // transactions, categories, and budgets.
  //
  // Deliberately never logging or returning the raw error/exception here
  // (success or failure) — nothing derived from an admin-client call
  // should surface anywhere the service role key could conceivably leak
  // through, including a stray console.error or an error.message passed
  // back to the client.
  let failed = false
  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.sub)
    failed = !!error
  } catch {
    failed = true
  }

  if (failed) {
    return { error: 'Something went wrong deleting your account. Please try again.' }
  }

  await supabase.auth.signOut()
  redirect('/account-deleted')
}
