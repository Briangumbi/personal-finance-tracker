import { createClient } from '@supabase/supabase-js'

// Admin client using the service role key — bypasses Row Level Security
// entirely. Server-only, and used in exactly one place (deleting a user's
// own account via the Auth Admin API, which has no self-service equivalent
// in the regular client SDK). Never import this from a client component or
// any RLS-relying query path; see src/app/settings/actions.ts for the one
// call site and why its errors are never logged or passed through.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
