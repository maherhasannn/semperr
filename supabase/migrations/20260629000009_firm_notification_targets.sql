-- Normalize notification recipients so each firm can have multiple email/SMS endpoints.
-- Firm members can read the list, but only owners/admins can manage it.

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE TABLE IF NOT EXISTS public.firm_notification_targets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id      UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  value        TEXT NOT NULL,
  label        TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT firm_notification_targets_firm_channel_value_unique UNIQUE (firm_id, channel, value)
);

CREATE INDEX IF NOT EXISTS idx_firm_notification_targets_firm_id
  ON public.firm_notification_targets (firm_id);

CREATE INDEX IF NOT EXISTS idx_firm_notification_targets_active
  ON public.firm_notification_targets (firm_id, active);

CREATE OR REPLACE FUNCTION public.is_firm_owner_or_admin(target_firm_id UUID)
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
      AND firm_users.role IN ('owner', 'admin')
  );
$$;

ALTER TABLE public.firm_notification_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own firm notification targets" ON public.firm_notification_targets;
DROP POLICY IF EXISTS "Users manage own firm notification targets" ON public.firm_notification_targets;

CREATE POLICY "Users read own firm notification targets"
  ON public.firm_notification_targets FOR SELECT
  USING (public.is_firm_member(firm_notification_targets.firm_id));

CREATE POLICY "Users manage own firm notification targets"
  ON public.firm_notification_targets FOR INSERT
  WITH CHECK (public.is_firm_owner_or_admin(firm_notification_targets.firm_id));

CREATE POLICY "Users update own firm notification targets"
  ON public.firm_notification_targets FOR UPDATE
  USING (public.is_firm_owner_or_admin(firm_notification_targets.firm_id))
  WITH CHECK (public.is_firm_owner_or_admin(firm_notification_targets.firm_id));

CREATE POLICY "Users delete own firm notification targets"
  ON public.firm_notification_targets FOR DELETE
  USING (public.is_firm_owner_or_admin(firm_notification_targets.firm_id));

INSERT INTO public.firm_notification_targets (firm_id, channel, value, label, is_primary, active)
SELECT
  fu.firm_id,
  'email',
  fu.email,
  CASE
    WHEN fu.role = 'owner' THEN 'Primary account email'
    WHEN fu.role = 'admin' THEN 'Admin email'
    ELSE 'Notification email'
  END,
  fu.role = 'owner',
  TRUE
FROM public.firm_users fu
WHERE fu.email IS NOT NULL
  AND fu.email <> ''
  AND fu.role IN ('owner', 'admin')
ON CONFLICT (firm_id, channel, value) DO NOTHING;

INSERT INTO public.firm_notification_targets (firm_id, channel, value, label, is_primary, active)
SELECT
  fu.firm_id,
  'sms',
  fu.phone_number,
  CASE
    WHEN fu.role = 'owner' THEN 'Primary account SMS'
    WHEN fu.role = 'admin' THEN 'Admin SMS'
    ELSE 'Notification SMS'
  END,
  fu.role = 'owner',
  TRUE
FROM public.firm_users fu
WHERE fu.phone_number IS NOT NULL
  AND fu.phone_number <> ''
  AND fu.role IN ('owner', 'admin')
ON CONFLICT (firm_id, channel, value) DO NOTHING;
