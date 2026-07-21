
ALTER TABLE public.law_firms
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS regulator_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS regulator_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS regulator_verification_data JSONB;

-- Backfill verified_at for previously verified firms
UPDATE public.law_firms SET verified_at = COALESCE(verified_at, updated_at) WHERE is_verified = true AND verified_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_firm_verified_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified = true AND (OLD.is_verified IS DISTINCT FROM true) THEN
    NEW.verified_at = COALESCE(NEW.verified_at, now());
  END IF;
  IF NEW.is_verified = false THEN
    NEW.verified_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_firm_verified_at ON public.law_firms;
CREATE TRIGGER trg_set_firm_verified_at
  BEFORE UPDATE OF is_verified ON public.law_firms
  FOR EACH ROW EXECUTE FUNCTION public.set_firm_verified_at();
