-- Adds an optional fee_amount to transactions, extracted from mobile money
-- SMS confirmations when present (e.g. "Transaction cost, Ksh33.00"), or
-- entered manually. Additive only: nullable, no backfill, no changes to
-- existing columns. The fee sits on the same row as fee_amount, distinct
-- from the transaction's main `amount` — it is not logged as its own
-- transaction and does not get folded into a "Mobile Money Fees" category
-- entry.
alter table public.transactions
  add column if not exists fee_amount numeric(14, 2)
    check (fee_amount is null or fee_amount >= 0);

comment on column public.transactions.fee_amount is
  'Optional transaction fee extracted from a parsed SMS confirmation or entered manually, distinct from the main amount. Null when no fee applies.';
