-- Normalize notification target values at the database boundary so direct writes
-- cannot bypass the dashboard's formatting rules.

CREATE OR REPLACE FUNCTION public.normalize_firm_notification_target_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_value TEXT;
  stripped_value TEXT;
  digits TEXT;
BEGIN
  raw_value := COALESCE(NEW.value, '');

  IF NEW.channel = 'email' THEN
    NEW.value := lower(btrim(raw_value));

    IF NEW.value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'Invalid email address';
    END IF;

    RETURN NEW;
  END IF;

  stripped_value := lower(btrim(raw_value));
  stripped_value := regexp_replace(stripped_value, '(?:ext\.?|x)\s*\d+$', '', 'i');
  stripped_value := regexp_replace(stripped_value, '[()\s.-]', '', 'g');

  IF left(stripped_value, 1) = '+' THEN
    digits := regexp_replace(substr(stripped_value, 2), '\D', '', 'g');
    IF digits ~ '^[0-9]{8,15}$' THEN
      NEW.value := '+' || digits;
      RETURN NEW;
    END IF;
  ELSE
    digits := regexp_replace(stripped_value, '\D', '', 'g');

    IF length(digits) = 10 THEN
      NEW.value := '+1' || digits;
      RETURN NEW;
    ELSIF length(digits) = 11 AND left(digits, 1) = '1' THEN
      NEW.value := '+' || digits;
      RETURN NEW;
    ELSIF length(digits) BETWEEN 8 AND 15 THEN
      NEW.value := '+' || digits;
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Invalid phone number';
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_firm_notification_target_value ON public.firm_notification_targets;

CREATE TRIGGER trg_normalize_firm_notification_target_value
BEFORE INSERT OR UPDATE ON public.firm_notification_targets
FOR EACH ROW
EXECUTE FUNCTION public.normalize_firm_notification_target_value();

UPDATE public.firm_notification_targets
SET value = value;

