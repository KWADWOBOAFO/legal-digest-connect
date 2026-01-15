-- Drop the overly permissive policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Notifications are only inserted via SECURITY DEFINER trigger functions, 
-- so no direct INSERT policy is needed for regular users.
-- The triggers use SECURITY DEFINER which bypasses RLS.