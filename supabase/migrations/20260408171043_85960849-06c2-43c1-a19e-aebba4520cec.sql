
ALTER TABLE public.profiles ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN approved_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN approved_by uuid;
