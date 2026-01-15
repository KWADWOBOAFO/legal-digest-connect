-- Document versions table for tracking version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(document_id, version_number)
);

-- Enable RLS on document_versions
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of documents they can access
CREATE POLICY "Users can view document versions"
ON public.document_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_versions.document_id
    AND (
      sd.uploaded_by = auth.uid()
      OR (sd.shared_with_client = true AND EXISTS (
        SELECT 1 FROM cases c WHERE c.id = sd.case_id AND c.user_id = auth.uid()
      ))
      OR (sd.shared_with_firm = true AND EXISTS (
        SELECT 1 FROM law_firms lf
        JOIN case_matches cm ON cm.firm_id = lf.id
        WHERE lf.user_id = auth.uid() AND cm.case_id = sd.case_id
      ))
    )
  )
);

-- Policy: Document owners can insert versions
CREATE POLICY "Document owners can insert versions"
ON public.document_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_versions.document_id
    AND sd.uploaded_by = auth.uid()
  )
);

-- Document annotations table
CREATE TABLE public.document_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'text', 'drawing', 'shape', 'stamp')),
  annotation_data JSONB NOT NULL, -- Stores Fabric.js object data
  color TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_annotations
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view annotations on documents they can access
CREATE POLICY "Users can view annotations"
ON public.document_annotations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_annotations.document_id
    AND (
      sd.uploaded_by = auth.uid()
      OR (sd.shared_with_client = true AND EXISTS (
        SELECT 1 FROM cases c WHERE c.id = sd.case_id AND c.user_id = auth.uid()
      ))
      OR (sd.shared_with_firm = true AND EXISTS (
        SELECT 1 FROM law_firms lf
        JOIN case_matches cm ON cm.firm_id = lf.id
        WHERE lf.user_id = auth.uid() AND cm.case_id = sd.case_id
      ))
    )
  )
);

-- Policy: Authenticated users can create annotations
CREATE POLICY "Users can create annotations"
ON public.document_annotations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_annotations.document_id
    AND (
      sd.uploaded_by = auth.uid()
      OR (sd.shared_with_firm = true AND EXISTS (
        SELECT 1 FROM law_firms lf
        JOIN case_matches cm ON cm.firm_id = lf.id
        WHERE lf.user_id = auth.uid() AND cm.case_id = sd.case_id
      ))
    )
  )
);

-- Policy: Users can update their own annotations
CREATE POLICY "Users can update their annotations"
ON public.document_annotations
FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Users can delete their own annotations
CREATE POLICY "Users can delete their annotations"
ON public.document_annotations
FOR DELETE
USING (auth.uid() = created_by);

-- Document comments table for discussion threads
CREATE TABLE public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  annotation_id UUID REFERENCES public.document_annotations(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_resolved BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on document_comments
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on documents they can access
CREATE POLICY "Users can view comments"
ON public.document_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_comments.document_id
    AND (
      sd.uploaded_by = auth.uid()
      OR (sd.shared_with_client = true AND EXISTS (
        SELECT 1 FROM cases c WHERE c.id = sd.case_id AND c.user_id = auth.uid()
      ))
      OR (sd.shared_with_firm = true AND EXISTS (
        SELECT 1 FROM law_firms lf
        JOIN case_matches cm ON cm.firm_id = lf.id
        WHERE lf.user_id = auth.uid() AND cm.case_id = sd.case_id
      ))
    )
  )
);

-- Policy: Users can create comments
CREATE POLICY "Users can create comments"
ON public.document_comments
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.shared_documents sd
    WHERE sd.id = document_comments.document_id
    AND (
      sd.uploaded_by = auth.uid()
      OR (sd.shared_with_firm = true AND EXISTS (
        SELECT 1 FROM law_firms lf
        JOIN case_matches cm ON cm.firm_id = lf.id
        WHERE lf.user_id = auth.uid() AND cm.case_id = sd.case_id
      ))
    )
  )
);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their comments"
ON public.document_comments
FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Users can delete their own comments  
CREATE POLICY "Users can delete their comments"
ON public.document_comments
FOR DELETE
USING (auth.uid() = created_by);

-- Add display_order column to shared_documents for drag-drop ordering
ALTER TABLE public.shared_documents 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_shared_documents_order ON public.shared_documents(case_id, display_order);

-- Allow document owners to update display order
CREATE POLICY "Users can update document order"
ON public.shared_documents
FOR UPDATE
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());