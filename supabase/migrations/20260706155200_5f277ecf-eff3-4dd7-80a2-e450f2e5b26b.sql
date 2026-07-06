
-- Tighten consultations INSERT policy: verify case ownership and matching firm
DROP POLICY IF EXISTS "Users can create consultations for their cases" ON public.consultations;

CREATE POLICY "Users can create consultations for their cases"
ON public.consultations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = consultations.case_id
      AND c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.case_matches cm
    WHERE cm.case_id = consultations.case_id
      AND cm.firm_id = consultations.firm_id
  )
);

-- Tighten reviews INSERT policy: verify consultation belongs to user and firm, and is completed
DROP POLICY IF EXISTS "Users can create reviews for their consultations" ON public.reviews;

CREATE POLICY "Users can create reviews for their consultations"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.consultations co
    WHERE co.id = reviews.consultation_id
      AND co.user_id = auth.uid()
      AND co.firm_id = reviews.firm_id
      AND co.status = 'completed'
  )
);
