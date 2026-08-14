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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const accountId = String(formData.get('accountId') ?? '')
  const direction = String(formData.get('direction') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')
  const amountRaw = String(formData.get('amount') ?? '')
  const note = String(formData.get('note') ?? '').trim()
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

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('currency')
    .eq('id', accountId)
    .single()

  if (accountError || !account) {
    return { error: 'That account could not be found.' }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: accountId,
    category_id: categoryId || null,
    direction,
    amount,
    currency: account.currency,
    note: note || null,
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('transactions').delete().eq('id', id)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}
