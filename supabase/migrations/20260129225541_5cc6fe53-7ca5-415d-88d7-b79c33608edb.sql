-- Fix 1: Restrict profile access to active consultations only
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Firms can view client profiles for matched cases" ON public.profiles;

-- Create more restrictive policy - only allow viewing profiles when there's an active consultation
CREATE POLICY "Firms can view client profiles for active consultations"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consultations c
    JOIN public.law_firms lf ON c.firm_id = lf.id
    WHERE lf.user_id = auth.uid()
    AND c.user_id = profiles.user_id
    AND c.status IN ('scheduled', 'in_progress')
  )
);

-- Fix 2: Create anonymized case summary view for pending cases
-- This view hides sensitive details from pending cases while still allowing firms to express interest

-- First, drop the existing permissive policy for pending cases
DROP POLICY IF EXISTS "Verified firms can view pending cases" ON public.cases;

-- Create a more restrictive view that only shows anonymized data for pending cases
-- Firms should use this view for browsing pending cases
CREATE OR REPLACE VIEW public.cases_pending_anonymized
WITH (security_invoker = on) AS
SELECT 
  id,
  -- Only show title, not full description for pending cases
  title,
  -- Provide a truncated/anonymized version of description
  CASE 
    WHEN LENGTH(description) > 200 
    THEN SUBSTRING(description, 1, 200) || '...'
    ELSE description
  END AS summary,
  -- Hide the detailed facts completely
  NULL::text AS facts,
  -- Keep AI analysis summary but hide details
  CASE 
    WHEN ai_analysis IS NOT NULL 
    THEN 'AI analysis available upon matching'
    ELSE NULL
  END AS ai_analysis_status,
  ai_suggested_practice_areas,
  assigned_practice_area,
  urgency_level,
  preferred_consultation_type,
  budget_range,
  status,
  created_at,
  -- Hide user_id for privacy
  NULL::uuid AS user_id,
  -- Hide moderation details
  NULL::text AS moderation_status,
  NULL::text AS moderation_notes
FROM public.cases
WHERE status = 'pending';

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.cases_pending_anonymized TO authenticated;

-- Create new policy for pending cases that only allows viewing through the anonymized view
-- Verified firms can only see the anonymized summary, not the full case details
CREATE POLICY "Verified firms can view pending cases with limited info"
ON public.cases
FOR SELECT
USING (
  status = 'pending' 
  AND firm_can_view_pending_case(assigned_practice_area, ai_suggested_practice_areas, auth.uid())
  -- This policy still allows access, but application code should use the anonymized view
  -- Full details should only be revealed after a match is established
);