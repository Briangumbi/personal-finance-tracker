-- Personal Finance Tracker: profile country
-- Adds the user's country to profiles, used to scope bank/provider
-- suggestions when adding an account (see bank_providers). Nullable —
-- existing accounts predate this and simply see no country-specific
-- suggestions until they set one.
alter table public.profiles
  add column if not exists country_code text check (country_code ~ '^[A-Z]{2}$');

comment on column public.profiles.country_code is
  'ISO 3166-1 alpha-2 country code, e.g. TZ, US, GB. Drives bank_providers suggestions in the account form.';
