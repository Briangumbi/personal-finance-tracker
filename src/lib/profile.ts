import type { SupabaseClient } from '@supabase/supabase-js'

// Falls back to email for accounts that predate the username feature (no
// profiles row yet) or if the lookup itself fails for any reason.
export async function getDisplayName(
  supabase: SupabaseClient,
  user: { sub: string; email?: string }
) {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.sub)
    .single()

  return data?.username ?? user.email ?? ''
}
