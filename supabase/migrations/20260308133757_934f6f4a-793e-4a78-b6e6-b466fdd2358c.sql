
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny direct inserts"
ON public.admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny direct updates"
ON public.admin_activity_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny direct deletes"
ON public.admin_activity_log
FOR DELETE
TO authenticated
USING (false);
