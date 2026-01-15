-- Add document category column to shared_documents table
ALTER TABLE public.shared_documents 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' 
CHECK (category IN ('contracts', 'evidence', 'correspondence', 'financial', 'identification', 'general'));

-- Add index for faster category queries
CREATE INDEX IF NOT EXISTS idx_shared_documents_category ON public.shared_documents(category);

-- Create a table to track per-firm document sharing permissions
CREATE TABLE IF NOT EXISTS public.document_firm_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shared_by UUID NOT NULL,
  UNIQUE(document_id, firm_id)
);

-- Enable RLS on document_firm_shares
ALTER TABLE public.document_firm_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Document owners can manage sharing
CREATE POLICY "Document owners can manage sharing"
ON public.document_firm_shares
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_firm_shares.document_id
    AND sd.uploaded_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_firm_shares.document_id
    AND sd.uploaded_by = auth.uid()
  )
);

-- Policy: Firms can view shares made to them
CREATE POLICY "Firms can view their document shares"
ON public.document_firm_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.law_firms lf
    WHERE lf.id = document_firm_shares.firm_id
    AND lf.user_id = auth.uid()
  )
);

-- Update shared_documents RLS to include per-firm sharing
DROP POLICY IF EXISTS "Users can view shared documents for their cases" ON public.shared_documents;

CREATE POLICY "Users can view shared documents"
ON public.shared_documents
FOR SELECT
USING (
  -- Owner can always view
  uploaded_by = auth.uid()
  OR
  -- Client can view if shared with client
  (shared_with_client = true AND EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = shared_documents.case_id
    AND c.user_id = auth.uid()
  ))
  OR
  -- Firm can view if shared with firm generally
  (shared_with_firm = true AND EXISTS (
    SELECT 1 FROM law_firms lf
    JOIN case_matches cm ON cm.firm_id = lf.id
    WHERE lf.user_id = auth.uid()
    AND cm.case_id = shared_documents.case_id
  ))
  OR
  -- Firm can view if specifically shared with them
  EXISTS (
    SELECT 1 FROM document_firm_shares dfs
    JOIN law_firms lf ON lf.id = dfs.firm_id
    WHERE dfs.document_id = shared_documents.id
    AND lf.user_id = auth.uid()
  )
);