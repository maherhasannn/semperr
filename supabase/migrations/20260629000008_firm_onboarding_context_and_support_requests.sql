-- Capture more context at request-access time and route later changes through support.

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_title TEXT,
  ADD COLUMN IF NOT EXISTS practice_areas TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS support_notes TEXT;

CREATE TABLE IF NOT EXISTS public.firm_support_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type        TEXT NOT NULL CHECK (request_type IN ('firm_profile_update', 'payment_change', 'state_rank_change', 'buying_rules_change')),
  details             JSONB NOT NULL DEFAULT '{}'::jsonb,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_firm_support_requests_firm_id ON public.firm_support_requests (firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_support_requests_status ON public.firm_support_requests (status);

ALTER TABLE public.firm_support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own support requests" ON public.firm_support_requests;
DROP POLICY IF EXISTS "Users create own support requests" ON public.firm_support_requests;

CREATE POLICY "Users read own support requests"
  ON public.firm_support_requests FOR SELECT
  USING (public.is_firm_member(firm_support_requests.firm_id));

CREATE POLICY "Users create own support requests"
  ON public.firm_support_requests FOR INSERT
  WITH CHECK (
    public.is_firm_member(firm_support_requests.firm_id)
    AND firm_support_requests.requested_by_user_id = auth.uid()
  );

-- No firm-side UPDATE/DELETE policies. Support handles resolution and implementation.
