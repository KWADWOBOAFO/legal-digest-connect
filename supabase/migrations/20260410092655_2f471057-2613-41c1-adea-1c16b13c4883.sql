
-- Fix security definer view by setting security_invoker
ALTER VIEW public.cases_pending_anonymized SET (security_invoker = on);
