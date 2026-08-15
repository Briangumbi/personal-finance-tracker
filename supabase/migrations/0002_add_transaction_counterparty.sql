-- Promotes sender/receiver context out of the freeform `note` column into
-- its own structured field. Additive only: nullable, no backfill, no
-- changes to existing columns. Historical rows keep counterparty = null;
-- only new transactions (via the SMS parser) populate it going forward.
alter table public.transactions
  add column if not exists counterparty text;

comment on column public.transactions.counterparty is
  'Structured sender/receiver name, extracted from a parsed SMS confirmation when available. Distinct from the freeform note field.';
