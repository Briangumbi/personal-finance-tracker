'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AuthFormState } from '@/app/login/actions'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get('username') ?? '').trim()
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!USERNAME_RE.test(username)) {
    return {
      error: 'Username must be 3-20 characters: letters, numbers, or underscore.',
    }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
      data: { username },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // The new user has no session yet (email confirmation is pending), so
    // the regular RLS-scoped client can't insert here — auth.uid() would be
    // null. Uses the same service-role client as account deletion for this
    // one trusted, server-only insert; see lib/supabase/admin.ts.
    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ user_id: data.user.id, username })

    if (profileError) {
      if (profileError.code === '23505') {
        return { error: 'That username is taken. Please choose another.' }
      }
      return { error: profileError.message }
    }
  }

  redirect('/signup/check-email')
}
