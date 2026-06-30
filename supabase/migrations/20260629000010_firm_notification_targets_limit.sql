-- Enforce a hard limit of 10 email targets and 10 SMS targets per firm.
-- The dashboard also blocks additional rows, but the database enforces it too.

CREATE OR REPLACE FUNCTION public.enforce_firm_notification_target_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_count INTEGER;
BEGIN
  IF NEW.active IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COUNT(*)
      INTO target_count
    FROM public.firm_notification_targets
    WHERE firm_id = NEW.firm_id
      AND channel = NEW.channel
      AND active = TRUE
      AND id <> NEW.id;
  ELSE
    SELECT COUNT(*)
      INTO target_count
    FROM public.firm_notification_targets
    WHERE firm_id = NEW.firm_id
      AND channel = NEW.channel
      AND active = TRUE;
  END IF;

  IF target_count >= 10 THEN
    RAISE EXCEPTION 'A firm can have at most 10 active % notification targets', NEW.channel;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_firm_notification_target_limits ON public.firm_notification_targets;

CREATE TRIGGER trg_enforce_firm_notification_target_limits
BEFORE INSERT OR UPDATE ON public.firm_notification_targets
FOR EACH ROW
EXECUTE FUNCTION public.enforce_firm_notification_target_limits();
