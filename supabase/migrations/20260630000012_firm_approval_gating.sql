-- Track manual approval and delayed ungating for new firm accounts.

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gated_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_firms_gated_until ON public.firms (gated_until);
CREATE INDEX IF NOT EXISTS idx_firms_approval_email_sent_at ON public.firms (approval_email_sent_at);
