-- Fix infinite recursion in RLS policies - Complete migration
-- The issue: cases SELECT policy references case_matches, and case_matches SELECT policy references cases

-- Step 1: Create security-definer functions (these bypass RLS checks)
CREATE OR REPLACE FUNCTION public.user_owns_case(p_case_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c 
    WHERE c.id = p_case_id AND c.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_firm_has_match(p_case_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.law_firms lf
    JOIN public.case_matches cm ON cm.firm_id = lf.id
    WHERE cm.case_id = p_case_id AND lf.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.firm_can_view_pending_case(p_practice_area TEXT, p_suggested_areas TEXT[], p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.law_firms lf
    WHERE lf.user_id = p_user_id 
    AND lf.is_verified = true 
    AND lf.nda_signed = true
    AND (
      p_practice_area = ANY(lf.practice_areas) 
      OR lf.practice_areas && p_suggested_areas
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Drop all problematic policies
DROP POLICY IF EXISTS "Secure cases visibility" ON public.cases;
DROP POLICY IF EXISTS "Firms can view matched cases only" ON public.cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Firms can view matched cases" ON public.cases;
DROP POLICY IF EXISTS "Verified firms can view pending cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view matches for their cases" ON public.case_matches;
DROP POLICY IF EXISTS "Firms can view their matches" ON public.case_matches;

-- Step 3: Recreate policies for cases table
CREATE POLICY "Users can view their own cases" ON public.cases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Firms can view matched cases" ON public.cases
FOR SELECT USING (
  public.user_firm_has_match(id, auth.uid())
);

CREATE POLICY "Verified firms can view pending cases" ON public.cases
FOR SELECT USING (
  status = 'pending' AND 
  public.firm_can_view_pending_case(assigned_practice_area, ai_suggested_practice_areas, auth.uid())
);

-- Step 4: Recreate policies for case_matches table
CREATE POLICY "Users can view matches for their cases" ON public.case_matches
FOR SELECT USING (
  public.user_owns_case(case_id, auth.uid())
);

CREATE POLICY "Firms can view their matches" ON public.case_matches
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.law_firms lf
    WHERE lf.id = case_matches.firm_id AND lf.user_id = auth.uid()
  )
);