# Personal Finance Tracker

A personal finance tracker built for anyone worldwide — first-class support for
mobile money accounts (M-Pesa, Tigo Pesa, Airtel Money, etc.) alongside
traditional bank/card accounts, not just the latter.

## Stack

- Next.js (App Router) + Tailwind
- Supabase (Postgres + Auth) — free tier
- Vercel — free tier hosting

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

3. Run the schema migration against your Supabase project. Easiest path:
   open the Supabase Dashboard → SQL Editor, paste the contents of
   [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql),
   and run it. (Or use the [Supabase CLI](https://supabase.com/docs/guides/cli)
   if you have it installed: `supabase db push`.)
4. In Supabase Dashboard → Authentication → URL Configuration, add
   `http://localhost:3000/auth/confirm` as a redirect URL (and your production
   URL once deployed).
5. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). You'll land on
   `/login`; use "Sign up" to create an account, confirm via the email
   Supabase sends, then log in.

## What's built so far

- Email/password auth (signup, login, logout, email confirmation) via
  Supabase Auth, using `@supabase/ssr` for cookie-based sessions.
- Route protection via `src/proxy.ts` (Next.js 16's replacement for
  `middleware.ts`) — unauthenticated users are redirected to `/login`,
  logged-in users are redirected away from `/login`/`/signup`.
- Database schema (`supabase/migrations/0001_init_schema.sql`): `accounts`
  (flexible type: bank / card / mobile_money / cash / other, with a free-text
  `provider` field for mobile money), `categories` (shared defaults + custom
  per-user), and `transactions` — all with row level security scoping every
  row to its owning user.
- A placeholder `/dashboard` page confirming the logged-in user's email.

Not built yet: account setup UI, transaction entry, the SMS-paste parser, and
the dashboard/history views.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Deploy on Vercel

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new).
Set the same environment variables from `.env.local` in your Vercel project
settings, and update `NEXT_PUBLIC_SITE_URL` to your production URL.
