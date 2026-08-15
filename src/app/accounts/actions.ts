'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ACCOUNT_TYPES } from '@/lib/accounts'

export type AccountFormState = {
  error: string | null
}

const VALID_TYPES = ACCOUNT_TYPES.map((t) => t.value) as string[]

export async function createAccount(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? '')
  const providerSelect = String(formData.get('provider') ?? '').trim()
  const providerOther = String(formData.get('providerOther') ?? '').trim()
  const currencySelect = String(formData.get('currency') ?? '').trim()
  const currencyOther = String(formData.get('currencyOther') ?? '').trim()
  const startingBalanceRaw = String(formData.get('startingBalance') ?? '')

  if (!name) {
    return { error: 'Account name is required.' }
  }

  if (!VALID_TYPES.includes(type)) {
    return { error: 'Choose a valid account type.' }
  }

  const provider =
    type === 'mobile_money'
      ? providerSelect === 'Other'
        ? providerOther
        : providerSelect
      : null

  if (type === 'mobile_money' && !provider) {
    return { error: 'Provider is required for mobile money accounts.' }
  }

  const currency = (
    currencySelect === 'Other' ? currencyOther : currencySelect
  ).toUpperCase()

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: 'Currency must be a 3-letter code, e.g. USD.' }
  }

  const startingBalance = startingBalanceRaw === '' ? 0 : Number(startingBalanceRaw)
  if (!Number.isFinite(startingBalance)) {
    return { error: 'Starting balance must be a number.' }
  }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.sub,
    name,
    type,
    provider,
    currency,
    starting_balance: startingBalance,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  redirect('/accounts')
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('accounts').delete().eq('id', id)

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}
