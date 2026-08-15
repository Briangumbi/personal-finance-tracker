import Link from 'next/link'
import { ChitMark } from '@/components/chit-mark'

export const metadata = {
  title: 'Privacy Policy — Chit',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 no-underline">
          <ChitMark size="sm" />
          <span className="font-(family-name:--font-heading) text-lg font-semibold text-(--color-text)">
            Chit
          </span>
        </Link>

        <h2 className="mb-1">Privacy Policy</h2>
        <p className="mb-8 text-xs text-muted">Last updated August 2026</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed">
          <section>
            <h4 className="mb-2">What we collect</h4>
            <p>
              When you use Chit, we store the information you enter: your email address (for
              login), the accounts you add (name, type, currency, starting balance), transactions
              you record (amount, currency, category, date, and any note or counterparty you
              add), custom categories, and budgets you set. Chit doesn&apos;t connect to your real
              bank or mobile money account — everything is entered manually or pasted in by you.
            </p>
          </section>

          <section>
            <h4 className="mb-2">How we use it</h4>
            <p>
              This data is used only to show it back to you: your balances, spending breakdowns,
              and budget alerts. We don&apos;t sell it, share it with advertisers, or use it for
              anything beyond running the app for you.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Where it&apos;s stored</h4>
            <p>
              Data is stored in a Supabase database (Postgres). Access is restricted at the
              database level so your data is only readable by your own account. Connections to
              the app are encrypted in transit. That said, this is an independently-run personal
              project, not an audited or certified financial system — treat it accordingly and
              don&apos;t store anything here you wouldn&apos;t be comfortable storing in a
              well-run but informally-operated app.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Cookies</h4>
            <p>
              Chit uses a cookie to keep you logged in. That&apos;s it — no advertising or
              analytics cookies.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Other services</h4>
            <p>
              Currency conversion rates are fetched from a free public exchange-rate API. Only a
              currency code is sent for this — none of your personal or financial data leaves
              Chit for this purpose.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Your data</h4>
            <p>
              You can delete individual accounts, transactions, and budgets yourself at any time
              from within the app. To delete your account entirely, contact{' '}
              <a href="mailto:briangumbi3+chit@gmail.com">briangumbi3+chit@gmail.com</a>.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Changes</h4>
            <p>This policy may be updated as the app changes. Check back occasionally.</p>
          </section>

          <p className="text-xs text-muted italic">
            This is a plain-language summary for a personal project, not a legally reviewed
            document.
          </p>
        </div>

        <Link href="/" className="btn btn-ghost mt-10 inline-flex">
          ← Back to Chit
        </Link>
      </div>
    </div>
  )
}
