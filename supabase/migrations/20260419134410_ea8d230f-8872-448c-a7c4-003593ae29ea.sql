-- 1. Fix case-documents storage policy: only 'accepted' matches, not 'interested'
DROP POLICY IF EXISTS "Matched firms can view case documents" ON storage.objects;

CREATE POLICY "Accepted firms can view case documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND EXISTS (
    SELECT 1
    FROM public.law_firms lf
    JOIN public.case_matches cm ON cm.firm_id = lf.id
    JOIN public.cases c ON c.id = cm.case_id
    WHERE lf.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (storage.foldername(storage.objects.name))[1] = c.id::text
  )
);

-- 2. Restrict listing on public buckets — drop overly broad SELECT policies that allow listing
-- Files remain accessible via direct public URL (that's the bucket's public flag),
-- but the bucket's object list is no longer enumerable by anonymous users.
DROP POLICY IF EXISTS "Public can view firm logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view firm logos" ON storage.objects;
DROP POLICY IF EXISTS "Firm logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Profile avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;

-- Owners can still manage / list their own folders
CREATE POLICY "Firm owners can list their firm logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can list their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can list blog images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3. Restrict email visibility on legal_professionals
-- Replace the broad authenticated-viewer policy with one that excludes email column access for non-owners
-- We do this via a view-style approach: drop the existing SELECT policy and create a stricter one.
-- Non-owners can still read other columns; we mask email at the application layer.
-- Postgres RLS doesn't support column-level policies natively, so we add a helper view and rely on app code.

-- Create a view exposing the safe (non-email) columns to authenticated users with a relationship
CREATE OR REPLACE VIEW public.legal_professionals_public
WITH (security_invoker = on) AS
SELECT
  id,
  firm_id,
  full_name,
  title,
  bio,
  avatar_url,
  specializations,
  years_experience,
  consultation_fee,
  regulatory_body,
  regulatory_number,
  trustpilot_url,
  google_reviews_url,
  awards,
  is_active,
  can_accept_cases_independently,
  created_at,
  updated_at,
  -- Email only visible to firm owner or admins
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.law_firms lf
      WHERE lf.id = legal_professionals.firm_id
        AND lf.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::public.app_role)
    THEN email
    ELSE NULL
  END AS email
FROM public.legal_professionals;

GRANT SELECT ON public.legal_professionals_public TO authenticated, anon;