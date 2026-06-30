-- Remove the delayed accept/decline lead routing flow.
-- Routing is now immediate: a lead is either delivered to the highest-ranked eligible firm
-- or recorded in lead_waste if no firm qualifies.

DROP TABLE IF EXISTS public.lead_route_attempts CASCADE;

ALTER TABLE public.leads
  DROP COLUMN IF EXISTS current_route_attempt_id,
  DROP COLUMN IF EXISTS response_due_at,
  DROP COLUMN IF EXISTS accepted_at,
  DROP COLUMN IF EXISTS declined_at;
