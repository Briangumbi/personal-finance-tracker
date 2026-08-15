import Link from 'next/link'
import { ChitMark } from '@/components/chit-mark'

export const metadata = {
  title: 'Terms of Service — Chit',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 no-underline">
          <ChitMark size="sm" />
          <span className="font-(family-name:--font-heading) text-lg font-semibold text-(--color-text)">
            Chit
          </span>
        </Link>

        <h2 className="mb-1">Terms of Service</h2>
        <p className="mb-8 text-xs text-muted">Last updated August 2026</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed">
          <section>
            <h4 className="mb-2">What this is</h4>
            <p>
              Chit is a personal finance tracking tool. It helps you record and organize
              accounts, transactions, and budgets that you enter yourself. It is not a bank, not
              a regulated financial institution, and does not move or manage real money.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Not financial advice</h4>
            <p>
              Nothing in Chit is financial, investment, tax, or legal advice. For real financial
              decisions, talk to a qualified professional.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Accuracy</h4>
            <p>
              Chit only knows what you tell it. Balances, totals, and currency conversions are
              only as accurate as the data you enter and the exchange rates available at the
              time — Chit does not verify anything against your actual bank or mobile money
              accounts.
            </p>
          </section>

          <section>
            <h4 className="mb-2">No uptime or availability guarantee</h4>
            <p>
              This is an independently-run project on free-tier infrastructure. It may be slow,
              temporarily unavailable, changed, or discontinued without notice. Don&apos;t rely
              on it as your only record of your finances — keep your own backups.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Use at your own risk</h4>
            <p>
              You&apos;re responsible for your own financial decisions and for the accuracy of
              what you enter. You&apos;re responsible for keeping your login credentials secure.
            </p>
          </section>

          <section>
            <h4 className="mb-2">No warranty</h4>
            <p>Chit is provided &quot;as is,&quot; without warranties of any kind, express or implied.</p>
          </section>

          <section>
            <h4 className="mb-2">Limitation of liability</h4>
            <p>
              To the fullest extent permitted by law, the developer of Chit is not liable for any
              damages or losses arising from your use of, or inability to use, the app.
            </p>
          </section>

          <section>
            <h4 className="mb-2">Changes</h4>
            <p>These terms may be updated as the app evolves.</p>
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
