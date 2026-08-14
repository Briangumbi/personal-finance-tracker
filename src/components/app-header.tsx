import Link from 'next/link'
import { logout } from '@/lib/supabase/actions'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
]

export function AppHeader({
  email,
  active,
}: {
  email: string
  active: string
}) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <nav className="flex items-center gap-5">
          <span className="text-sm font-semibold text-neutral-900">
            Finance Tracker
          </span>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                active === link.href
                  ? 'text-sm font-medium text-neutral-900'
                  : 'text-sm text-neutral-500 hover:text-neutral-900'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            {email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
