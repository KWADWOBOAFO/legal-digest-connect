-- Fix: Restrict legal_professionals SELECT to authenticated users only (was public/anon)
DROP POLICY IF EXISTS "Anyone can view professionals from verified firms" ON public.legal_professionals;

CREATE POLICY "Authenticated users can view professionals from verified firms"
ON public.legal_professionals FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM law_firms
  WHERE law_firms.id = legal_professionals.firm_id
  AND law_firms.is_verified = true
));