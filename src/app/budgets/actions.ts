'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/rate-limit'

export type BudgetFormState = {
  error: string | null
}

export async function createBudget(
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  if (await isRateLimited(supabase, 'budgets', user.sub)) {
    return { error: 'Too many budgets created in a short time. Please wait a moment and try again.' }
  }

  const categoryId = String(formData.get('categoryId') ?? '')
  const limitAmountRaw = String(formData.get('limitAmount') ?? '')

  if (!categoryId) {
    return { error: 'Choose a category.' }
  }

  const limitAmount = Number(limitAmountRaw)
  if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
    return { error: 'Limit must be a positive number.' }
  }
  // budgets.limit_amount is numeric(14, 2) — 12 digits before the decimal
  // point, max. Reject here with a clean message instead of letting a
  // pasted/garbled huge number hit the database and surface a raw
  // Postgres overflow error.
  if (limitAmount >= 1_000_000_000_000) {
    return { error: 'Limit is too large.' }
  }

  // Categories RLS already scopes SELECT to shared defaults + this user's
  // own, so this also confirms categoryId isn't a private category
  // belonging to someone else before we reference it.
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    return { error: 'That category could not be found.' }
  }

  const { error } = await supabase.from('budgets').insert({
    user_id: user.sub,
    category_id: categoryId,
    period: 'monthly',
    limit_amount: limitAmount,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'That category already has a budget.' }
    }
    return { error: error.message }
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  redirect('/budgets')
}

export async function deleteBudget(formData: FormData) {
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

  await supabase.from('budgets').delete().eq('id', id)

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}
