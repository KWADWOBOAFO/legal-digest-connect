-- 1) RLS on realtime.messages — restrict channel subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to own user channels" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to own user channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow subscribing to channels named with the user's own id as prefix
  -- e.g. "approval-<uid>", "user-<uid>-notifications", "<uid>:..."
  (realtime.topic() LIKE '%' || auth.uid()::text || '%')
);

-- Also allow broadcasting/presence for the user's own channels (writes from clients)
DROP POLICY IF EXISTS "Authenticated users can write to own user channels" ON realtime.messages;
CREATE POLICY "Authenticated users can write to own user channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE '%' || auth.uid()::text || '%')
);

-- 2) Revoke EXECUTE on SECURITY DEFINER helpers from anon/authenticated
-- These are only called from RLS policies / triggers (run as postgres), not from the API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_owns_case(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_firm_has_match(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.firm_can_view_pending_case(text, text[], uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_case_match() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_consultation_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;