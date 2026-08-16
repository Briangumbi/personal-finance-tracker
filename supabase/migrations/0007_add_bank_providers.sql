-- Personal Finance Tracker: bank/provider suggestions
-- A small reference table of well-known banks, mobile money services, and
-- card networks per country, used to suggest a provider name when adding
-- an account instead of always falling back to free text. Read-only from
-- the app's perspective — no user ever writes to this table, so there's no
-- insert/update/delete policy, only select.
create table if not exists public.bank_providers (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  provider_name text not null,
  provider_type text not null check (provider_type in ('bank', 'mobile_money', 'card_network')),
  created_at timestamptz not null default now()
);

create index if not exists bank_providers_country_code_idx on public.bank_providers (country_code);
create unique index if not exists bank_providers_unique
  on public.bank_providers (country_code, lower(provider_name));

alter table public.bank_providers enable row level security;

create policy "Any authenticated user can view bank providers"
  on public.bank_providers for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- seed data — 9 countries only; every other country simply has no rows
-- here, and the account form falls back to free text when that's the case.
-- ---------------------------------------------------------------------------
insert into public.bank_providers (country_code, provider_name, provider_type) values
  ('TZ', 'CRDB', 'bank'),
  ('TZ', 'NMB', 'bank'),
  ('TZ', 'NBC', 'bank'),
  ('TZ', 'Selcom', 'mobile_money'),
  ('TZ', 'M-Pesa (Vodacom)', 'mobile_money'),
  ('TZ', 'Tigo Pesa', 'mobile_money'),
  ('TZ', 'Airtel Money', 'mobile_money'),

  ('KE', 'KCB', 'bank'),
  ('KE', 'Equity Bank', 'bank'),
  ('KE', 'Co-operative Bank', 'bank'),
  ('KE', 'M-Pesa (Safaricom)', 'mobile_money'),
  ('KE', 'Airtel Money', 'mobile_money'),

  ('UG', 'Stanbic Uganda', 'bank'),
  ('UG', 'Centenary Bank', 'bank'),
  ('UG', 'MTN Mobile Money', 'mobile_money'),
  ('UG', 'Airtel Money', 'mobile_money'),

  ('RW', 'Bank of Kigali', 'bank'),
  ('RW', 'Equity Rwanda', 'bank'),
  ('RW', 'MTN Mobile Money', 'mobile_money'),
  ('RW', 'Airtel Money', 'mobile_money'),

  ('ZA', 'Standard Bank', 'bank'),
  ('ZA', 'FNB', 'bank'),
  ('ZA', 'Absa', 'bank'),
  ('ZA', 'Nedbank', 'bank'),
  ('ZA', 'Capitec', 'bank'),

  ('NG', 'GTBank', 'bank'),
  ('NG', 'Access Bank', 'bank'),
  ('NG', 'Zenith Bank', 'bank'),
  ('NG', 'First Bank', 'bank'),
  ('NG', 'Opay', 'mobile_money'),
  ('NG', 'PalmPay', 'mobile_money'),

  ('US', 'Chase', 'bank'),
  ('US', 'Bank of America', 'bank'),
  ('US', 'Wells Fargo', 'bank'),
  ('US', 'Amex', 'card_network'),
  ('US', 'Citi', 'bank'),

  ('GB', 'Barclays', 'bank'),
  ('GB', 'HSBC', 'bank'),
  ('GB', 'Lloyds', 'bank'),
  ('GB', 'NatWest', 'bank'),
  ('GB', 'Monzo', 'bank'),
  ('GB', 'Revolut', 'bank'),

  ('CN', 'ICBC', 'bank'),
  ('CN', 'Bank of China', 'bank'),
  ('CN', 'Alipay', 'mobile_money'),
  ('CN', 'WeChat Pay', 'mobile_money'),
  ('CN', 'China Construction Bank', 'bank')
on conflict do nothing;
