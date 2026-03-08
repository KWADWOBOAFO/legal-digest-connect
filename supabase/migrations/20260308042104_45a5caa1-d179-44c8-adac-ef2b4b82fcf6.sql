-- Tighten legal_professionals SELECT policy: only expose to users with active consultations/matches
DROP POLICY IF EXISTS "Authenticated users can view professionals from verified firms" ON public.legal_professionals;

CREATE POLICY "Users can view professionals from firms with active relationship"
ON public.legal_professionals FOR SELECT
TO authenticated
USING (
  -- Firm owner can always see their own professionals
  EXISTS (
    SELECT 1 FROM law_firms
    WHERE law_firms.id = legal_professionals.firm_id
    AND law_firms.user_id = auth.uid()
  )
  OR
  -- Users with active consultations with the firm
  EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.firm_id = legal_professionals.firm_id
    AND c.user_id = auth.uid()
    AND c.status IN ('scheduled', 'in_progress')
  )
  OR
  -- Users with case matches to the firm
  EXISTS (
    SELECT 1 FROM case_matches cm
    JOIN cases cs ON cs.id = cm.case_id
    WHERE cm.firm_id = legal_professionals.firm_id
    AND cs.user_id = auth.uid()
  )
  OR
  -- Admins
  has_role(auth.uid(), 'admin')
);