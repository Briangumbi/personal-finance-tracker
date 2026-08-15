'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type TransactionFormState = {
  error: string | null
}

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const supabase = await createClient()
  // getClaims() verifies the JWT locally against Supabase's cached JWKS
  // instead of a network round trip to the Auth server on every request
  // (see lib/supabase/middleware.ts for details).
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    redirect('/login')
  }

  const accountId = String(formData.get('accountId') ?? '')
  const direction = String(formData.get('direction') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')
  const amountRaw = String(formData.get('amount') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const counterparty = String(formData.get('counterparty') ?? '').trim()
  const feeAmountRaw = String(formData.get('feeAmount') ?? '').trim()
  const occurredOn = String(formData.get('occurredOn') ?? '')

  if (direction !== 'in' && direction !== 'out') {
    return { error: 'Choose whether money came in or went out.' }
  }

  if (!accountId) {
    return { error: 'Choose an account.' }
  }

  const amount = Number(amountRaw)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number.' }
  }

  if (!occurredOn) {
    return { error: 'Choose a date.' }
  }

  let feeAmount: number | null = null
  if (feeAmountRaw) {
    feeAmount = Number(feeAmountRaw)
    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      return { error: 'Fee must be zero or a positive number.' }
    }
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('currency')
    .eq('id', accountId)
    .single()

  if (accountError || !account) {
    return { error: 'That account could not be found.' }
  }

  // Category is optional, but if one was picked it must be a real category
  // this user can actually see — categories RLS already scopes SELECT to
  // shared defaults + this user's own, so this also rules out referencing
  // someone else's private category.
  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return { error: 'That category could not be found.' }
    }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.sub,
    account_id: accountId,
    category_id: categoryId || null,
    direction,
    amount,
    currency: account.currency,
    note: note || null,
    counterparty: counterparty || null,
    fee_amount: feeAmount,
    occurred_on: occurredOn,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  redirect('/transactions')
}

export async function deleteTransaction(formData: FormData) {
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

  await supabase.from('transactions').delete().eq('id', id)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}
