-- Drop the overly permissive policy that allows ANY authenticated user to see ALL pending cases
DROP POLICY IF EXISTS "Firms can view cases matching their practice areas" ON public.cases;

-- Create a more restrictive policy:
-- 1. Users can always see their own cases
-- 2. Firms that have been matched to a case can see it
-- 3. ONLY verified firms with signed NDAs can see pending cases, and ONLY if practice areas match
CREATE POLICY "Secure cases visibility" ON public.cases FOR SELECT USING (
  -- Case owner can always see their cases
  (auth.uid() = user_id) 
  OR
  -- Firms that have been matched to this case can view it
  EXISTS (
    SELECT 1 FROM public.case_matches cm 
    JOIN public.law_firms lf ON cm.firm_id = lf.id 
    WHERE cm.case_id = cases.id AND lf.user_id = auth.uid()
  )
  OR
  -- Verified firms with signed NDAs can view ONLY pending cases matching their practice areas
  (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.law_firms lf
      WHERE lf.user_id = auth.uid()
      AND lf.is_verified = true
      AND lf.nda_signed = true
      AND (
        -- Match on assigned practice area
        cases.assigned_practice_area = ANY(lf.practice_areas)
        OR 
        -- Match on AI suggested practice areas (overlap)
        lf.practice_areas && cases.ai_suggested_practice_areas
      )
    )
  )
);