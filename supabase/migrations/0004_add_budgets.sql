-- Personal Finance Tracker: budgets
-- Per-category monthly spending limits, compared against actual spend on
-- the dashboard. Additive only — does not touch accounts, categories, or
-- transactions.
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  period text not null default 'monthly' check (period = 'monthly'),
  limit_amount numeric(14, 2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, period)
);

comment on column public.budgets.period is
  'Comparison window. Only "monthly" is supported today - the dashboard only computes spend for the current calendar month, so any other value would never be compared against anything. Loosen this constraint later if weekly/yearly support is added.';
comment on column public.budgets.limit_amount is
  'Spending limit for the category, in whatever currency the dashboard''s "Spend this month" section already shows (the user''s single account currency, or the converted base currency if they hold multiple) - not a separately tracked currency.';

create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_category_id_idx on public.budgets (category_id);

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- row level security — same owner-only pattern as accounts/transactions
-- ---------------------------------------------------------------------------
alter table public.budgets enable row level security;

create policy "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);
