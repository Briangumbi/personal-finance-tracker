'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type BudgetFormState = {
  error: string | null
}

export async function createBudget(
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('budgets').delete().eq('id', id)

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}
