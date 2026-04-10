
-- 1. Add admin-only SELECT policy on contact_inquiries
CREATE POLICY "Admins can view contact inquiries"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix firm-logos storage policies to check ownership
DROP POLICY IF EXISTS "Firm owners can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Firm owners can update logos" ON storage.objects;

CREATE POLICY "Firm owners can delete their own logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Firm owners can update their own logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Fix legal_professionals SELECT policy to restrict to active relationships only
DROP POLICY IF EXISTS "Users can view professionals from firms with active relationshi" ON public.legal_professionals;

CREATE POLICY "Users can view professionals from firms with active relationships"
ON public.legal_professionals
FOR SELECT
TO authenticated
USING (
  -- Firm owners can always see their own professionals
  EXISTS (
    SELECT 1 FROM public.law_firms
    WHERE law_firms.id = legal_professionals.firm_id
    AND law_firms.user_id = auth.uid()
  )
  -- Users with active consultations
  OR EXISTS (
    SELECT 1 FROM public.consultations c
    WHERE c.firm_id = legal_professionals.firm_id
    AND c.user_id = auth.uid()
    AND c.status IN ('scheduled', 'in_progress')
  )
  -- Users with accepted case matches only
  OR EXISTS (
    SELECT 1 FROM public.case_matches cm
    JOIN public.cases cs ON cs.id = cm.case_id
    WHERE cm.firm_id = legal_professionals.firm_id
    AND cs.user_id = auth.uid()
    AND cm.status = 'accepted'
  )
  -- Admins
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. Recreate view without SECURITY DEFINER
DROP VIEW IF EXISTS public.cases_pending_anonymized;

CREATE VIEW public.cases_pending_anonymized AS
SELECT
  id,
  title,
  CASE
    WHEN length(description) > 200 THEN substring(description, 1, 200) || '...'
    ELSE description
  END AS summary,
  NULL::text AS facts,
  CASE
    WHEN ai_analysis IS NOT NULL THEN 'AI analysis available upon matching'
    ELSE NULL::text
  END AS ai_analysis_status,
  ai_suggested_practice_areas,
  assigned_practice_area,
  urgency_level,
  preferred_consultation_type,
  NULL::text AS budget_range,
  status,
  created_at,
  NULL::uuid AS user_id,
  NULL::text AS moderation_status,
  NULL::text AS moderation_notes
FROM public.cases
WHERE status = 'pending'::case_status;
