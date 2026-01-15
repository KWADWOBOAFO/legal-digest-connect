
-- Create conversations table for messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'firm')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_documents table for document sharing
CREATE TABLE public.shared_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  uploader_type TEXT NOT NULL CHECK (uploader_type IN ('client', 'firm')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_encrypted BOOLEAN NOT NULL DEFAULT true,
  shared_with_client BOOLEAN NOT NULL DEFAULT false,
  shared_with_firm BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Clients can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Firms can view their conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.law_firms lf
    WHERE lf.id = conversations.firm_id
    AND lf.user_id = auth.uid()
  ));

CREATE POLICY "Clients can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Firms can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.law_firms lf
    WHERE lf.id = firm_id
    AND lf.user_id = auth.uid()
  ));

-- Messages policies
CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.law_firms lf
      WHERE lf.id = c.firm_id AND lf.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.law_firms lf
      WHERE lf.id = c.firm_id AND lf.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Participants can mark messages as read"
  ON public.messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.law_firms lf
      WHERE lf.id = c.firm_id AND lf.user_id = auth.uid()
    ))
  ));

-- Shared documents policies
CREATE POLICY "Users can view shared documents for their cases"
  ON public.shared_documents FOR SELECT
  USING (
    (uploaded_by = auth.uid()) OR
    (shared_with_client = true AND EXISTS (
      SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()
    )) OR
    (shared_with_firm = true AND EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.law_firms lf ON lf.user_id = auth.uid()
      JOIN public.case_matches cm ON cm.case_id = c.id AND cm.firm_id = lf.id
      WHERE c.id = case_id
    ))
  );

CREATE POLICY "Users can upload documents"
  ON public.shared_documents FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders can delete their documents"
  ON public.shared_documents FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_firm_id ON public.conversations(firm_id);
CREATE INDEX idx_shared_documents_case_id ON public.shared_documents(case_id);
