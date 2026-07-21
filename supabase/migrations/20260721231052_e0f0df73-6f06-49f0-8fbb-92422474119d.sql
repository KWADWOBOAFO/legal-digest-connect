
-- 1) Verify Law365 immediately
UPDATE public.law_firms
SET is_verified = true,
    verified_at = COALESCE(verified_at, now())
WHERE id = '72385de4-62e7-448c-9bc7-68c78e9101c9';

-- 2) Keep firm verification in sync with profile approval for firm users
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
        AND is_verified = false;
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

DROP TRIGGER IF EXISTS sync_firm_verification_on_profile_approval ON public.profiles;
CREATE TRIGGER sync_firm_verification_on_profile_approval
AFTER UPDATE OF is_approved ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_firm_verification_with_profile();
