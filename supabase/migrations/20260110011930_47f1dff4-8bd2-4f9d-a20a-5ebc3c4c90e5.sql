-- Create enum types for the platform
CREATE TYPE public.user_type AS ENUM ('individual', 'firm');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.case_status AS ENUM ('pending', 'matched', 'consultation_scheduled', 'accepted', 'rejected', 'completed');
CREATE TYPE public.consultation_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Profiles table for all users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type user_type NOT NULL DEFAULT 'individual',
  avatar_url TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (for security - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Law firms table
CREATE TABLE public.law_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  firm_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  practice_areas TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  nda_signed BOOLEAN DEFAULT false,
  nda_signed_at TIMESTAMP WITH TIME ZONE,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Legal professionals (lawyers within firms)
CREATE TABLE public.legal_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  specializations TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  years_experience INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Practice areas reference table
CREATE TABLE public.practice_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert all practice areas
INSERT INTO public.practice_areas (name, description) VALUES
  ('Criminal Law', 'Offenses against the state, including theft, assault, and fraud'),
  ('Contract Law', 'Agreements between parties, including breach of contract'),
  ('Family Law', 'Divorce, custody, adoption, and domestic matters'),
  ('Property Law', 'Real estate, land ownership, and property disputes'),
  ('Tax Law', 'Tax obligations, disputes, and planning'),
  ('Cyber Crime Law', 'Digital crimes, hacking, and online fraud'),
  ('Tort Law', 'Civil wrongs and negligence claims'),
  ('Intellectual Property Law', 'Patents, trademarks, copyrights'),
  ('Immigration Law', 'Visas, citizenship, and deportation'),
  ('Employment Law', 'Workplace rights, discrimination, and contracts'),
  ('Commercial Law', 'Business transactions and trade'),
  ('Company Law', 'Corporate governance and formation'),
  ('Maritime Law', 'Shipping, navigation, and maritime disputes'),
  ('Wills, Trust and Probate Law', 'Estate planning and inheritance'),
  ('Environmental Law', 'Environmental protection and regulations'),
  ('Sports Law', 'Sports contracts, disputes, and regulations'),
  ('Media and Entertainment Law', 'Media rights, contracts, and disputes'),
  ('Banking and Finance Law', 'Financial regulations and disputes'),
  ('Technology and AI Law', 'Tech regulations, AI ethics, and data law'),
  ('Construction Law', 'Building contracts and disputes'),
  ('Personal Injury Law', 'Accident claims and compensation'),
  ('Clinical Negligence', 'Medical malpractice and healthcare errors'),
  ('Human Rights Law', 'Civil liberties and human rights violations'),
  ('Constitutional and Administrative Law', 'Government powers and judicial review'),
  ('ADR Law', 'Arbitration, mediation, and dispute resolution');

-- Cases table (legal matters submitted by individuals)
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  facts TEXT,
  ai_analysis TEXT,
  ai_suggested_practice_areas TEXT[] DEFAULT '{}',
  assigned_practice_area TEXT,
  status case_status DEFAULT 'pending' NOT NULL,
  urgency_level TEXT DEFAULT 'normal',
  preferred_consultation_type TEXT DEFAULT 'video',
  budget_range TEXT,
  documents_url TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Case matches (when firms express interest in cases)
CREATE TABLE public.case_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.legal_professionals(id),
  status TEXT DEFAULT 'interested' NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(case_id, firm_id)
);

-- Consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.legal_professionals(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status consultation_status DEFAULT 'scheduled' NOT NULL,
  meeting_url TEXT,
  notes TEXT,
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(consultation_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Firms can view client profiles for matched cases" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.case_matches cm 
    JOIN public.law_firms lf ON cm.firm_id = lf.id 
    JOIN public.cases c ON cm.case_id = c.id
    WHERE lf.user_id = auth.uid() AND c.user_id = profiles.user_id
  )
);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for law_firms
CREATE POLICY "Anyone can view verified firms" ON public.law_firms FOR SELECT USING (is_verified = true);
CREATE POLICY "Firm owners can view their firm" ON public.law_firms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Firm owners can update their firm" ON public.law_firms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create their firm" ON public.law_firms FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for legal_professionals
CREATE POLICY "Anyone can view professionals from verified firms" ON public.legal_professionals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND is_verified = true)
);
CREATE POLICY "Firm owners can manage their professionals" ON public.legal_professionals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);

-- RLS Policies for practice_areas
CREATE POLICY "Anyone can view practice areas" ON public.practice_areas FOR SELECT USING (true);

-- RLS Policies for cases
CREATE POLICY "Users can view their own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Firms can view cases matching their practice areas" ON public.cases FOR SELECT USING (
  status = 'pending' OR EXISTS (
    SELECT 1 FROM public.case_matches cm 
    JOIN public.law_firms lf ON cm.firm_id = lf.id 
    WHERE cm.case_id = cases.id AND lf.user_id = auth.uid()
  )
);

-- RLS Policies for case_matches
CREATE POLICY "Users can view matches for their cases" ON public.case_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND user_id = auth.uid())
);
CREATE POLICY "Firms can view their matches" ON public.case_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);
CREATE POLICY "Firms can create matches" ON public.case_matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);
CREATE POLICY "Firms can update their matches" ON public.case_matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);

-- RLS Policies for consultations
CREATE POLICY "Users can view their consultations" ON public.consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Firms can view their consultations" ON public.consultations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);
CREATE POLICY "Firms can create consultations" ON public.consultations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);
CREATE POLICY "Firms can update their consultations" ON public.consultations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view non-anonymous reviews" ON public.reviews FOR SELECT USING (is_anonymous = false);
CREATE POLICY "Firm owners can view all their reviews" ON public.reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.law_firms WHERE id = firm_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view their own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews for their consultations" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::user_type, 'individual')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create update triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON public.law_firms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_professionals_updated_at BEFORE UPDATE ON public.legal_professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_case_matches_updated_at BEFORE UPDATE ON public.case_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();