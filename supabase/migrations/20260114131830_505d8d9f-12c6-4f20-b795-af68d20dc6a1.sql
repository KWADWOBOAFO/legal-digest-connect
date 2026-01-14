-- Fix: Drop overly permissive policy on cases table
DROP POLICY IF EXISTS "Firms can view cases matching their practice areas" ON public.cases;

-- Create more restrictive policy: Firms can only view cases they've been matched with
CREATE POLICY "Firms can view matched cases only"
ON public.cases
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM case_matches cm
    JOIN law_firms lf ON cm.firm_id = lf.id
    WHERE cm.case_id = cases.id
    AND lf.user_id = auth.uid()
  )
);

-- Fix user_roles table: Add policies to prevent unauthorized role manipulation
-- Only admins (via edge functions) should be able to insert/update/delete roles
-- For now, deny all direct modifications
CREATE POLICY "Deny direct role insertion"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct role updates"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Deny direct role deletion"
ON public.user_roles
FOR DELETE
USING (false);