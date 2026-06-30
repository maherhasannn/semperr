-- Track per-firm lead routing attempts so leads can advance by rank on timeout
-- or immediate decline without reusing the same firm twice for a single lead.

CREATE TABLE IF NOT EXISTS public.lead_route_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  firm_id          UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  state            TEXT NOT NULL,
  rank             INTEGER NOT NULL CHECK (rank > 0),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'wasted')),
  routed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_due_at  TIMESTAMPTZ NOT NULL,
  responded_at     TIMESTAMPTZ,
  route_reason     TEXT,
  CONSTRAINT lead_route_attempts_lead_firm_unique UNIQUE (lead_id, firm_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_route_attempts_lead_id ON public.lead_route_attempts (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_route_attempts_firm_id ON public.lead_route_attempts (firm_id);
CREATE INDEX IF NOT EXISTS idx_lead_route_attempts_due_at ON public.lead_route_attempts (response_due_at);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS current_route_rank INTEGER,
  ADD COLUMN IF NOT EXISTS current_route_attempt_id UUID REFERENCES public.lead_route_attempts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

ALTER TABLE public.lead_route_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own firm lead route attempts" ON public.lead_route_attempts;

CREATE POLICY "Users read own firm lead route attempts"
  ON public.lead_route_attempts FOR SELECT
  USING (public.is_firm_member(lead_route_attempts.firm_id));

