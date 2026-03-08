INSERT INTO storage.buckets (id, name, public)
VALUES ('firm-logos', 'firm-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Firm owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firm-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'firm'
  )
);

CREATE POLICY "Firm owners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'firm-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'firm'
  )
);

CREATE POLICY "Firm owners can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'firm-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'firm'
  )
);

CREATE POLICY "Anyone can view firm logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'firm-logos');