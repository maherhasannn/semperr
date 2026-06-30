-- State exclusivity is rank-based: lower rank gets first dibs for that state.
-- Firms may edit their own buying rules, but state assignments remain admin-managed.

CREATE TABLE IF NOT EXISTS public.state_exclusivity (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state      TEXT NOT NULL,
  firm_id    UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  rank       INTEGER NOT NULL CHECK (rank > 0),
  status     TEXT NOT NULL DEFAULT 'approved'
             CHECK (status IN ('approved', 'paused', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT state_exclusivity_state_firm_unique UNIQUE (state, firm_id),
  CONSTRAINT state_exclusivity_state_rank_unique UNIQUE (state, rank)
);

CREATE INDEX IF NOT EXISTS idx_state_exclusivity_state ON public.state_exclusivity (state);
CREATE INDEX IF NOT EXISTS idx_state_exclusivity_firm_id ON public.state_exclusivity (firm_id);

ALTER TABLE public.state_exclusivity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own state exclusivity" ON public.state_exclusivity;

CREATE POLICY "Users read own state exclusivity"
  ON public.state_exclusivity FOR SELECT
  USING (public.is_firm_member(state_exclusivity.firm_id));

-- No firm-side write policy on purpose. State rankings are admin-managed.

-- Lead waste is tracked explicitly when no ranked firm is eligible for a state.
CREATE TABLE IF NOT EXISTS public.lead_waste (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT NOT NULL,
  case_type   TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  claimant_name TEXT,
  claimant_contact TEXT,
  reason      TEXT NOT NULL,
  source_doc  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_waste ENABLE ROW LEVEL SECURITY;

-- Service-role only by omission.

