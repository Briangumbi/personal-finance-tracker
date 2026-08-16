import type { SupabaseClient } from '@supabase/supabase-js'

export type BankProvider = {
  id: string
  provider_name: string
  provider_type: 'bank' | 'mobile_money' | 'card_network'
}

// Looks up the user's country, then returns that country's seeded
// providers (or an empty array if no country is set, or the country isn't
// one of the ones with seed data yet) — callers fall back to free text in
// that case rather than showing an empty dropdown.
export async function getCountryProviders(
  supabase: SupabaseClient,
  userSub: string
): Promise<BankProvider[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('country_code')
    .eq('user_id', userSub)
    .single()

  if (!profile?.country_code) return []

  const { data } = await supabase
    .from('bank_providers')
    .select('id, provider_name, provider_type')
    .eq('country_code', profile.country_code)
    .order('provider_name', { ascending: true })
    .returns<BankProvider[]>()

  return data ?? []
}
