import type { SupabaseClient } from '@supabase/supabase-js'

const WINDOW_SECONDS = 60
const MAX_WRITES_PER_WINDOW = 20

type RateLimitedTable = 'transactions' | 'budgets' | 'accounts'

// Lightweight abuse guard for write-heavy actions (create transaction/
// budget/account) — counts how many rows this user has created in the given
// table within the last minute, using the created_at column every table
// already has, and reports whether they're at the ceiling. No new table,
// service, or dependency; just an extra check in front of the existing
// validation and insert, not a replacement for either.
export async function isRateLimited(
  supabase: SupabaseClient,
  table: RateLimitedTable,
  userId: string
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString()

  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)

  return (count ?? 0) >= MAX_WRITES_PER_WINDOW
}
