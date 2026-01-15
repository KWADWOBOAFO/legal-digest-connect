-- Allow matched law firms to view case documents
CREATE POLICY "Matched firms can view case documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents'
  AND EXISTS (
    SELECT 1 FROM case_matches cm
    JOIN law_firms lf ON cm.firm_id = lf.id
    JOIN cases c ON cm.case_id = c.id
    WHERE lf.user_id = auth.uid()
    AND cm.status IN ('accepted', 'interested')
    AND c.user_id::text = (storage.foldername(name))[1]
  )
);