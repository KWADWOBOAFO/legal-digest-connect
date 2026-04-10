UPDATE public.profiles
SET is_approved = true, approved_at = now()
WHERE email = 'kwadwo@kingscourtlaw.com';