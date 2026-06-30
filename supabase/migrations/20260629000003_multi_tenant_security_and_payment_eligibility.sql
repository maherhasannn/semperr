-- Harden tenant isolation, introduce payment eligibility flags, and align the
-- lead/transaction tables with the current product vocabulary.

-- ============================================================
-- COLUMN / TABLE NORMALIZATION
-- ============================================================
DO $$
BEGIN
  IF to_regclass('public.cases') IS NOT NULL AND to_regclass('public.leads') IS NULL THEN
    EXECUTE 'ALTER TABLE public.cases RENAME TO leads';
  END IF;

  IF to_regclass('public.ledger_entries') IS NOT NULL AND to_regclass('public.transactions') IS NULL THEN
    EXECUTE 'ALTER TABLE public.ledger_entries RENAME TO transactions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'firm_users'
      AND column_name = 'auth_user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'firm_users'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.firm_users RENAME COLUMN auth_user_id TO user_id';
  END IF;
END $$;

ALTER INDEX IF EXISTS public.idx_cases_firm_id RENAME TO idx_leads_firm_id;
ALTER INDEX IF EXISTS public.idx_ledger_firm_id RENAME TO idx_transactions_firm_id;
ALTER INDEX IF EXISTS public.idx_ledger_entries_case_deduction RENAME TO idx_transactions_case_deduction;
ALTER INDEX IF EXISTS public.idx_ledger_entries_stripe_ref RENAME TO idx_transactions_stripe_ref;

-- ============================================================
-- FIRMS: PAYMENT ELIGIBILITY FIELDS
-- ============================================================
ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'missing',
  ADD COLUMN IF NOT EXISTS has_valid_payment_method BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.firms
  ALTER COLUMN status SET DEFAULT 'paused';

ALTER TABLE public.firms
  DROP CONSTRAINT IF EXISTS firms_status_check;

ALTER TABLE public.firms
  ADD CONSTRAINT firms_status_check
  CHECK (status IN ('pending_verification', 'paused', 'active', 'suspended'));

ALTER TABLE public.firms
  DROP CONSTRAINT IF EXISTS firms_payment_status_check;

ALTER TABLE public.firms
  ADD CONSTRAINT firms_payment_status_check
  CHECK (payment_status IN ('missing', 'valid', 'invalid', 'card_failed'));

UPDATE public.firms
SET payment_status = COALESCE(payment_status, 'missing'),
    has_valid_payment_method = COALESCE(has_valid_payment_method, FALSE),
    status = COALESCE(status, 'paused');

-- ============================================================
-- FIRM SETTINGS TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.firm_delivery_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id      UUID NOT NULL UNIQUE REFERENCES public.firms(id) ON DELETE CASCADE,
  lead_delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  daily_cap    INTEGER NOT NULL DEFAULT 0 CHECK (daily_cap >= 0),
  monthly_cap  INTEGER NOT NULL DEFAULT 0 CHECK (monthly_cap >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.firm_buying_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id      UUID NOT NULL UNIQUE REFERENCES public.firms(id) ON DELETE CASCADE,
  states       TEXT[] NOT NULL DEFAULT '{}',
  case_types   TEXT[] NOT NULL DEFAULT '{}',
  min_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (min_price_cents >= 0),
  max_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (max_price_cents >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_firm_member(target_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.firm_users
    WHERE firm_users.firm_id = target_firm_id
      AND firm_users.user_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_buying_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own firm_user" ON public.firm_users;
DROP POLICY IF EXISTS "Users update own firm_user" ON public.firm_users;
DROP POLICY IF EXISTS "Users read own firm" ON public.firms;
DROP POLICY IF EXISTS "Users read own firm cases" ON public.leads;
DROP POLICY IF EXISTS "Users read own firm ledger" ON public.transactions;
DROP POLICY IF EXISTS "Users read own firm credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Users insert credit requests for own firm" ON public.credit_requests;
DROP POLICY IF EXISTS "Users read own firm messages" ON public.messages;
DROP POLICY IF EXISTS "Users insert messages for own firm" ON public.messages;

CREATE POLICY "Users read own firm_user"
  ON public.firm_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own firm"
  ON public.firms FOR SELECT
  USING (public.is_firm_member(firms.id));

CREATE POLICY "Users read own firm delivery settings"
  ON public.firm_delivery_settings FOR SELECT
  USING (public.is_firm_member(firm_delivery_settings.firm_id));

CREATE POLICY "Users manage own firm delivery settings"
  ON public.firm_delivery_settings FOR INSERT
  WITH CHECK (public.is_firm_member(firm_delivery_settings.firm_id));

CREATE POLICY "Users update own firm delivery settings"
  ON public.firm_delivery_settings FOR UPDATE
  USING (public.is_firm_member(firm_delivery_settings.firm_id))
  WITH CHECK (public.is_firm_member(firm_delivery_settings.firm_id));

CREATE POLICY "Users delete own firm delivery settings"
  ON public.firm_delivery_settings FOR DELETE
  USING (public.is_firm_member(firm_delivery_settings.firm_id));

CREATE POLICY "Users read own firm buying rules"
  ON public.firm_buying_rules FOR SELECT
  USING (public.is_firm_member(firm_buying_rules.firm_id));

CREATE POLICY "Users manage own firm buying rules"
  ON public.firm_buying_rules FOR INSERT
  WITH CHECK (public.is_firm_member(firm_buying_rules.firm_id));

CREATE POLICY "Users update own firm buying rules"
  ON public.firm_buying_rules FOR UPDATE
  USING (public.is_firm_member(firm_buying_rules.firm_id))
  WITH CHECK (public.is_firm_member(firm_buying_rules.firm_id));

CREATE POLICY "Users delete own firm buying rules"
  ON public.firm_buying_rules FOR DELETE
  USING (public.is_firm_member(firm_buying_rules.firm_id));

CREATE POLICY "Users read own firm leads"
  ON public.leads FOR SELECT
  USING (public.is_firm_member(leads.firm_id));

CREATE POLICY "Users read own firm transactions"
  ON public.transactions FOR SELECT
  USING (public.is_firm_member(transactions.firm_id));

CREATE POLICY "Users read own firm credit requests"
  ON public.credit_requests FOR SELECT
  USING (public.is_firm_member(credit_requests.firm_id));

CREATE POLICY "Users insert credit requests for own firm"
  ON public.credit_requests FOR INSERT
  WITH CHECK (public.is_firm_member(credit_requests.firm_id));

CREATE POLICY "Users read own firm messages"
  ON public.messages FOR SELECT
  USING (public.is_firm_member(messages.firm_id));

CREATE POLICY "Users insert messages for own firm"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_firm_member(messages.firm_id));

-- ============================================================
-- DEFAULT ROWS FOR NEW FIRMS
-- ============================================================
INSERT INTO public.firm_delivery_settings (firm_id)
SELECT f.id
FROM public.firms f
WHERE NOT EXISTS (
  SELECT 1 FROM public.firm_delivery_settings s WHERE s.firm_id = f.id
)
ON CONFLICT (firm_id) DO NOTHING;

INSERT INTO public.firm_buying_rules (firm_id)
SELECT f.id
FROM public.firms f
WHERE NOT EXISTS (
  SELECT 1 FROM public.firm_buying_rules r WHERE r.firm_id = f.id
)
ON CONFLICT (firm_id) DO NOTHING;

-- ============================================================
-- BALANCE VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.firm_balances AS
SELECT
  firm_id,
  COALESCE(SUM(amount_cents), 0)::INTEGER AS balance_cents
FROM public.transactions
GROUP BY firm_id;

