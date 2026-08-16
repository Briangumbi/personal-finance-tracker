import Link from 'next/link'
import { logout } from '@/lib/supabase/actions'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/settings', label: 'Settings' },
]

export function AppHeader({
  displayName,
  active,
}: {
  displayName: string
  active: string
}) {
  return (
    <header className="nav">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4">
        <span className="nav-brand">Chit</span>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">{displayName}</span>
          <form action={logout}>
            <button type="submit" className="btn btn-secondary">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
