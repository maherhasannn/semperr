-- Store direct contact phone numbers for firm users so routing/webhooks can return
-- both email and phone delivery targets.

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS phone_number TEXT;
