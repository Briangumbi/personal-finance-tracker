-- Personal Finance Tracker: user profiles
-- A username chosen at signup, used as the display identity throughout the
-- app instead of the raw email. One row per auth user; additive only —
-- does not touch accounts, categories, transactions, or budgets.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.username is
  '3-20 characters, letters/numbers/underscore only. Case-insensitive uniqueness enforced by profiles_username_unique below.';

create unique index if not exists profiles_username_unique on public.profiles (lower(username));

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- row level security — same owner-only pattern as accounts/transactions/budgets
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);
