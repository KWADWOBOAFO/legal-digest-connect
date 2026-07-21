
CREATE OR REPLACE FUNCTION public.sync_firm_verification_with_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'firm' AND NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    IF NEW.is_approved = true THEN
      UPDATE public.law_firms
      SET is_verified = true,
          verified_at = COALESCE(verified_at, now())
      WHERE user_id = NEW.user_id
        AND is_verified = false
        AND nda_signed = true;  -- require signed NDA before auto-verify
    ELSE
      UPDATE public.law_firms
      SET is_verified = false
      WHERE user_id = NEW.user_id
        AND is_verified = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_firm_verification_with_profile() FROM PUBLIC, anon, authenticated;
