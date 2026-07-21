
-- 1) Audit table
CREATE TABLE IF NOT EXISTS public.firm_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value boolean,
  new_value boolean,
  changed_by uuid,
  changed_by_role text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_status_audit_firm_id ON public.firm_status_audit(firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_status_audit_created_at ON public.firm_status_audit(created_at DESC);

GRANT SELECT ON public.firm_status_audit TO authenticated;
GRANT ALL ON public.firm_status_audit TO service_role;

ALTER TABLE public.firm_status_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view firm status audit" ON public.firm_status_audit;
CREATE POLICY "Admins can view firm status audit"
  ON public.firm_status_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Trigger that logs nda_signed / is_verified changes
CREATE OR REPLACE FUNCTION public.log_firm_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_source text := NULLIF(current_setting('app.audit_source', true), '');
BEGIN
  IF v_actor IS NULL THEN
    v_role := 'system_trigger';
    v_source := COALESCE(v_source, 'database trigger / background job');
  ELSIF public.has_role(v_actor, 'admin') THEN
    v_role := 'admin';
    v_source := COALESCE(v_source, 'admin dashboard action');
  ELSIF v_actor = NEW.user_id THEN
    v_role := 'firm_owner';
    v_source := COALESCE(v_source, 'firm onboarding / self-service');
  ELSE
    v_role := 'other_authenticated';
  END IF;

  IF NEW.nda_signed IS DISTINCT FROM OLD.nda_signed THEN
    INSERT INTO public.firm_status_audit (firm_id, field, old_value, new_value, changed_by, changed_by_role, source)
    VALUES (NEW.id, 'nda_signed', OLD.nda_signed, NEW.nda_signed, v_actor, v_role, v_source);
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    INSERT INTO public.firm_status_audit (firm_id, field, old_value, new_value, changed_by, changed_by_role, source)
    VALUES (NEW.id, 'is_verified', OLD.is_verified, NEW.is_verified, v_actor, v_role, v_source);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_firm_status_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_log_firm_status_changes ON public.law_firms;
CREATE TRIGGER trg_log_firm_status_changes
AFTER UPDATE OF nda_signed, is_verified ON public.law_firms
FOR EACH ROW
EXECUTE FUNCTION public.log_firm_status_changes();

-- 3) Enable realtime for the audit table and firm_status_audit
ALTER TABLE public.firm_status_audit REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'firm_status_audit'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.firm_status_audit';
  END IF;
END $$;

-- 4) Inconsistency view: verified but NDA not signed
CREATE OR REPLACE VIEW public.inconsistent_firm_statuses
WITH (security_invoker = on) AS
SELECT
  id,
  firm_name,
  user_id,
  is_verified,
  verified_at,
  nda_signed,
  nda_signed_at,
  created_at
FROM public.law_firms
WHERE is_verified = true
  AND nda_signed = false;

GRANT SELECT ON public.inconsistent_firm_statuses TO authenticated;

-- 5) Nightly consistency check via pg_cron (SQL-only, no HTTP secrets)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule any prior version to keep migration idempotent
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'nightly-firm-status-consistency-check' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'nightly-firm-status-consistency-check',
  '0 2 * * *',
  $CRON$
  INSERT INTO public.notifications (user_id, type, title, message, reference_type)
  SELECT
    ur.user_id,
    'firm_status_inconsistency',
    'Firm Status Inconsistency Detected',
    'Nightly check found ' || (SELECT count(*) FROM public.inconsistent_firm_statuses)::text
      || ' firm(s) marked verified without a signed NDA. Review the Status Audit tab.',
    'firm'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND EXISTS (SELECT 1 FROM public.inconsistent_firm_statuses);
  $CRON$
);
