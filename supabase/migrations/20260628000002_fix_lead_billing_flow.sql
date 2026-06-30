-- Align lead status, billing ledger, and contact fields with the app flow.

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS claimant_phone TEXT,
  ADD COLUMN IF NOT EXISTS claimant_email TEXT;

UPDATE public.cases
SET claimant_email = claimant_contact
WHERE claimant_email IS NULL
  AND claimant_contact IS NOT NULL
  AND claimant_contact ILIKE '%@%';

UPDATE public.cases
SET claimant_phone = claimant_contact
WHERE claimant_phone IS NULL
  AND claimant_contact IS NOT NULL
  AND claimant_contact NOT ILIKE '%@%';

ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_status_check;

ALTER TABLE public.cases
  ADD CONSTRAINT cases_status_check
  CHECK (status IN ('delivered', 'accepted', 'declined', 'credited'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_case_deduction
  ON public.ledger_entries (case_id)
  WHERE type = 'deduction';

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_stripe_ref
  ON public.ledger_entries (stripe_ref)
  WHERE stripe_ref IS NOT NULL;
