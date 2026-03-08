-- 1. Drop the policy that gives firms full-row access to cases table
DROP POLICY IF EXISTS "Verified firms can view pending cases with limited info" ON public.cases;

-- 2. Recreate the anonymized view WITHOUT budget_range and with security_invoker=off (default)
CREATE OR REPLACE VIEW public.cases_pending_anonymized
WITH (security_invoker=off) AS
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
        ELSE NULL
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
FROM cases
WHERE status = 'pending'::case_status;

-- 3. Revoke anon access to the view so unauthenticated users can't browse cases
REVOKE SELECT ON public.cases_pending_anonymized FROM anon;

-- 4. Ensure authenticated users can still access it
GRANT SELECT ON public.cases_pending_anonymized TO authenticated;