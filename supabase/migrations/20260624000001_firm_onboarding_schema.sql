-- ============================================================
-- FIRMS
-- ============================================================
CREATE TABLE public.firms (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  states_covered     TEXT[] NOT NULL DEFAULT '{}',
  bar_number         TEXT,
  bar_state          TEXT,
  tier               SMALLINT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3)),
  status             TEXT NOT NULL DEFAULT 'pending_verification'
                     CHECK (status IN ('pending_verification', 'active', 'suspended')),
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIRM_USERS
-- ============================================================
CREATE TABLE public.firm_users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id               UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  auth_user_id          UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email                 TEXT NOT NULL UNIQUE,
  name                  TEXT,
  role                  TEXT NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'admin', 'member')),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  terms_accepted_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_firm_users_email ON public.firm_users (email);
CREATE INDEX idx_firm_users_firm_id ON public.firm_users (firm_id);
CREATE INDEX idx_firm_users_auth_user_id ON public.firm_users (auth_user_id);

-- ============================================================
-- CASES
-- ============================================================
CREATE TABLE public.cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  state               TEXT NOT NULL,
  case_type           TEXT NOT NULL DEFAULT 'workers_comp',
  claimant_name       TEXT,
  claimant_contact    TEXT,
  injury_date         DATE,
  days_missed         INTEGER,
  employment_status   TEXT,
  no_current_attorney BOOLEAN,
  within_sol          BOOLEAN,
  intake_notes        TEXT,
  level               SMALLINT NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  price_cents         INTEGER NOT NULL CHECK (price_cents >= 0),
  recording_url       TEXT,
  trustedform_cert_url TEXT,
  source_doc          TEXT,
  consent_timestamp   TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'delivered'
                      CHECK (status IN ('delivered', 'credited')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_firm_id ON public.cases (firm_id);

-- ============================================================
-- LEDGER_ENTRIES (append-only)
-- ============================================================
CREATE TABLE public.ledger_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id      UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
               CHECK (type IN ('topup', 'deduction', 'credit', 'auto_recharge')),
  amount_cents INTEGER NOT NULL,
  case_id      UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  stripe_ref   TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_firm_id ON public.ledger_entries (firm_id);

-- ============================================================
-- CREDIT_REQUESTS
-- ============================================================
CREATE TABLE public.credit_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'approved', 'denied')),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_credit_requests_firm_id ON public.credit_requests (firm_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  case_id    UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  thread_id  UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_firm_id ON public.messages (firm_id);
CREATE INDEX idx_messages_thread_id ON public.messages (thread_id);

-- ============================================================
-- BALANCE VIEW (derived, never mutable)
-- ============================================================
CREATE OR REPLACE VIEW public.firm_balances AS
SELECT
  firm_id,
  COALESCE(SUM(amount_cents), 0)::INTEGER AS balance_cents
FROM public.ledger_entries
GROUP BY firm_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- firm_users: read/update own record
CREATE POLICY "Users read own firm_user"
  ON public.firm_users FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users update own firm_user"
  ON public.firm_users FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- firms: read own firm
CREATE POLICY "Users read own firm"
  ON public.firms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = firms.id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

-- cases: read own firm's cases
CREATE POLICY "Users read own firm cases"
  ON public.cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = cases.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

-- ledger_entries: read own firm's ledger
CREATE POLICY "Users read own firm ledger"
  ON public.ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = ledger_entries.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

-- credit_requests: read and insert for own firm
CREATE POLICY "Users read own firm credit requests"
  ON public.credit_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = credit_requests.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert credit requests for own firm"
  ON public.credit_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = credit_requests.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

-- messages: read and insert for own firm
CREATE POLICY "Users read own firm messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = messages.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert messages for own firm"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.firm_users
      WHERE firm_users.firm_id = messages.firm_id
        AND firm_users.auth_user_id = auth.uid()
    )
  );

-- Drop old accounts table
DROP TABLE IF EXISTS public.accounts;
