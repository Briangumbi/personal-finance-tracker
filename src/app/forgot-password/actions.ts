'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuthFormState } from '@/app/login/actions'

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '')

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  })

  // Supabase doesn't return an error for an unknown email here — only for
  // things like rate limiting or a malformed address — so surfacing it is
  // safe and doesn't leak whether an account exists.
  if (error) {
    return { error: error.message }
  }

  redirect('/forgot-password/check-email')
}
