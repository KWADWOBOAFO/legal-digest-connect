-- Enable realtime for case_matches table
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_matches;

-- Add meeting_url column to consultations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'meeting_url') THEN
        ALTER TABLE public.consultations ADD COLUMN meeting_url TEXT;
    END IF;
END $$;