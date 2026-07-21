
-- Firm verification email delivery tracking (idempotent)
CREATE TABLE public.firm_verification_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'firm_verified' | 'firm_rejected' | 'firm_verification_revoked'
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  recipient_email TEXT,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.firm_verification_emails TO authenticated;
GRANT ALL ON public.firm_verification_emails TO service_role;

ALTER TABLE public.firm_verification_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view verification emails" ON public.firm_verification_emails
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage verification emails" ON public.firm_verification_emails
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Firm owners can view their verification emails" ON public.firm_verification_emails
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.law_firms lf WHERE lf.id = firm_id AND lf.user_id = auth.uid()));

CREATE TRIGGER trg_firm_verification_emails_updated
  BEFORE UPDATE ON public.firm_verification_emails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.firm_verification_emails;

-- Notify firm owner in-app whenever their NDA / verification flags change
CREATE OR REPLACE FUNCTION public.notify_firm_owner_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_firm_name TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  SELECT user_id, firm_name INTO v_owner, v_firm_name FROM public.law_firms WHERE id = NEW.firm_id;
  IF v_owner IS NULL THEN RETURN NEW; END IF;

  IF NEW.field = 'nda_signed' THEN
    v_title := CASE WHEN NEW.new_value THEN 'NDA marked as signed' ELSE 'NDA marked as unsigned' END;
    v_message := 'Your firm ' || COALESCE(v_firm_name, '') || ' had its NDA status changed to ' ||
      CASE WHEN NEW.new_value THEN 'signed' ELSE 'not signed' END ||
      COALESCE(' (' || NEW.source || ')', '');
  ELSIF NEW.field = 'is_verified' THEN
    v_title := CASE WHEN NEW.new_value THEN 'Firm verified' ELSE 'Verification revoked' END;
    v_message := 'Your firm ' || COALESCE(v_firm_name, '') || ' is now ' ||
      CASE WHEN NEW.new_value THEN 'verified and active' ELSE 'no longer verified' END ||
      COALESCE(' (' || NEW.source || ')', '');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (v_owner, 'firm_status_change', v_title, v_message, NEW.firm_id, 'firm');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_firm_owner_status_change
  AFTER INSERT ON public.firm_status_audit
  FOR EACH ROW EXECUTE FUNCTION public.notify_firm_owner_on_status_change();
