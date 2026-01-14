-- Admin functionality for verifying law firms

-- Allow admins to view all law firms (including unverified)
CREATE POLICY "Admins can view all firms"
ON public.law_firms
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any law firm (for verification)
CREATE POLICY "Admins can update any firm"
ON public.law_firms
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles (for verification context)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all cases (for oversight)
CREATE POLICY "Admins can view all cases"
ON public.cases
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update the storage policy for case-documents to require accepted match status
-- First drop the existing policy that allows firms to view documents on any match
DROP POLICY IF EXISTS "Firms can view matched case documents" ON storage.objects;

-- Create new policy that requires the match to be accepted
CREATE POLICY "Firms can view accepted case documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents'
  AND (
    -- Document owner can always view their files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Firms can view documents ONLY after client accepts the match
    EXISTS (
      SELECT 1 FROM public.case_matches cm
      JOIN public.law_firms lf ON cm.firm_id = lf.id
      JOIN public.cases c ON cm.case_id = c.id
      WHERE lf.user_id = auth.uid()
      AND c.user_id::text = (storage.foldername(name))[1]
      AND cm.status = 'accepted'
    )
  )
);

-- Admins can view all documents for oversight
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents'
  AND public.has_role(auth.uid(), 'admin')
);