-- Create notifications table for storing user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Add moderation_status to cases table for admin queue
ALTER TABLE public.cases 
ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE public.cases 
ADD COLUMN moderation_notes TEXT;

ALTER TABLE public.cases 
ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.cases 
ADD COLUMN moderated_by UUID;

-- Create function to create notification on case match insert
CREATE OR REPLACE FUNCTION public.notify_on_case_match()
RETURNS TRIGGER AS $$
DECLARE
  case_record RECORD;
  firm_record RECORD;
BEGIN
  -- Only notify for 'interested' status
  IF NEW.status = 'interested' THEN
    -- Get case details
    SELECT title, user_id INTO case_record FROM public.cases WHERE id = NEW.case_id;
    -- Get firm details
    SELECT firm_name INTO firm_record FROM public.law_firms WHERE id = NEW.firm_id;
    
    -- Insert notification for case owner
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      case_record.user_id,
      'firm_interest',
      'New Firm Interest',
      firm_record.firm_name || ' has expressed interest in your case "' || case_record.title || '"',
      NEW.case_id,
      'case'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for case match notifications
CREATE TRIGGER on_case_match_insert
AFTER INSERT ON public.case_matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_case_match();

-- Create function to create notification on consultation status change
CREATE OR REPLACE FUNCTION public.notify_on_consultation_change()
RETURNS TRIGGER AS $$
DECLARE
  case_record RECORD;
  firm_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get case and firm details
  SELECT title INTO case_record FROM public.cases WHERE id = NEW.case_id;
  SELECT firm_name INTO firm_record FROM public.law_firms WHERE id = NEW.firm_id;
  
  -- Determine notification based on status change
  IF NEW.status = 'scheduled' AND (OLD IS NULL OR OLD.status != 'scheduled') THEN
    notification_title := 'Consultation Scheduled';
    notification_message := 'Your consultation with ' || firm_record.firm_name || ' for "' || case_record.title || '" has been scheduled';
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    notification_title := 'Consultation Completed';
    notification_message := 'Your consultation with ' || firm_record.firm_name || ' for "' || case_record.title || '" has been completed';
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    notification_title := 'Consultation Cancelled';
    notification_message := 'Your consultation with ' || firm_record.firm_name || ' for "' || case_record.title || '" has been cancelled';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Notify the user
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.user_id,
    'consultation_update',
    notification_title,
    notification_message,
    NEW.id,
    'consultation'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for consultation notifications
CREATE TRIGGER on_consultation_change
AFTER INSERT OR UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_consultation_change();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;