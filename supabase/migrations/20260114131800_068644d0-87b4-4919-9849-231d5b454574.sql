-- Create storage bucket for case documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can upload documents to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Firms with case matches can view client documents
CREATE POLICY "Firms can view matched case documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'case-documents'
  AND EXISTS (
    SELECT 1
    FROM case_matches cm
    JOIN law_firms lf ON cm.firm_id = lf.id
    JOIN cases c ON cm.case_id = c.id
    WHERE lf.user_id = auth.uid()
    AND c.user_id::text = (storage.foldername(name))[1]
  )
);