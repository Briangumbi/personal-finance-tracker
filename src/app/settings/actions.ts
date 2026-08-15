'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type DeleteMyAccountFormState = {
  error: string | null
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
