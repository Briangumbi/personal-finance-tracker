import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Forces this route to run fresh on every request instead of being
// statically cached at build time — the whole point is a live Supabase
// query on each ping, not a build-time snapshot.
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}
