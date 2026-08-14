-- Personal Finance Tracker: initial schema
-- Accounts, categories, and transactions, scoped per-user via Supabase Auth
-- (auth.users) and enforced with row level security.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
-- A money-holding source the user defines themselves. `type` covers the
-- common cases worldwide (bank, card, mobile money, cash); `provider` is a
-- free-text field only meaningful for mobile_money (M-Pesa, Tigo Pesa,
-- Airtel Money, Halopesa, Selcom, MTN MoMo, GCash, PayPal, Venmo, etc.) but
-- left nullable/free-text generally so it can double as a bank/card issuer
-- name if the user wants that detail.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'card', 'mobile_money', 'cash', 'other')),
  provider text,
  currency text not null check (char_length(currency) = 3),
  starting_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.accounts.currency is 'ISO 4217 currency code, e.g. USD, TZS, KES.';
comment on column public.accounts.provider is 'Free-text provider name; primarily used when type = mobile_money.';

create index if not exists accounts_user_id_idx on public.accounts (user_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
-- user_id is nullable so a set of shared defaults (user_id is null) can be
-- seeded once and read by every user, alongside each user's own custom
-- categories.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);
create unique index if not exists categories_unique_name_per_scope
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'), kind, lower(name));

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
-- currency is denormalized from the account at entry time so historical
-- transactions stay accurate even if an account's currency is edited later.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  direction text not null check (direction in ('in', 'out')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (char_length(currency) = 3),
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_account_id_idx on public.transactions (account_id);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
create index if not exists transactions_occurred_on_idx on public.transactions (occurred_on);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

create policy "Users can view default and their own categories"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- default categories, shared by every user (user_id is null)
-- ---------------------------------------------------------------------------
insert into public.categories (name, kind) values
  ('Salary', 'income'),
  ('Business Income', 'income'),
  ('Gifts Received', 'income'),
  ('Other Income', 'income'),
  ('Groceries', 'expense'),
  ('Rent & Housing', 'expense'),
  ('Utilities', 'expense'),
  ('Transport', 'expense'),
  ('Airtime & Data', 'expense'),
  ('Mobile Money Fees', 'expense'),
  ('Health', 'expense'),
  ('Education', 'expense'),
  ('Entertainment', 'expense'),
  ('Savings & Transfers', 'expense'),
  ('Other Expense', 'expense')
on conflict do nothing;
