-- Add enhanced profile fields to law_firms
ALTER TABLE public.law_firms
  ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trustpilot_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_reviews_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS firm_type text DEFAULT 'firm';

-- Add enhanced fields to legal_professionals
ALTER TABLE public.legal_professionals
  ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS regulatory_body text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS regulatory_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trustpilot_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_reviews_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS can_accept_cases_independently boolean DEFAULT false;

-- Add consultation fee quoted to case_matches
ALTER TABLE public.case_matches
  ADD COLUMN IF NOT EXISTS consultation_fee_quoted numeric DEFAULT NULL;

-- Add consultation_type to consultations (default video, enforced)
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS consultation_type text DEFAULT 'video';

-- Create regulatory bodies reference table
CREATE TABLE IF NOT EXISTS public.regulatory_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL,
  country text NOT NULL DEFAULT 'United Kingdom',
  website text DEFAULT NULL,
  verification_url text DEFAULT NULL,
  practice_areas text[] DEFAULT '{}'::text[],
  description text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view regulatory bodies"
  ON public.regulatory_bodies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage regulatory bodies"
  ON public.regulatory_bodies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed common UK regulatory bodies
INSERT INTO public.regulatory_bodies (name, abbreviation, country, website, verification_url, practice_areas, description) VALUES
  ('Solicitors Regulation Authority', 'SRA', 'United Kingdom', 'https://www.sra.org.uk', 'https://www.sra.org.uk/consumers/register/', ARRAY['Corporate Law','Commercial Law','Employment Law','Family Law','Property Law','Criminal Law','Immigration Law','Personal Injury','Intellectual Property','Tax Law','Dispute Resolution','Banking & Finance','Data Protection','Environmental Law','Medical Negligence','Public Law','Wills & Probate'], 'Regulates solicitors and law firms in England and Wales'),
  ('Bar Standards Board', 'BSB', 'United Kingdom', 'https://www.barstandardsboard.org.uk', 'https://www.barstandardsboard.org.uk/for-the-public/search-a-barristers-record.html', ARRAY['Criminal Law','Family Law','Immigration Law','Personal Injury','Employment Law','Public Law','Commercial Law','Dispute Resolution'], 'Regulates barristers in England and Wales'),
  ('CILEx Regulation', 'CILEx', 'United Kingdom', 'https://www.cilexregulation.org.uk', 'https://www.cilexregulation.org.uk/regulatory-community/', ARRAY['Property Law','Family Law','Employment Law','Criminal Law','Personal Injury','Wills & Probate'], 'Regulates Chartered Legal Executives'),
  ('Law Society of Scotland', 'LSS', 'United Kingdom', 'https://www.lawscot.org.uk', 'https://www.lawscot.org.uk/find-a-solicitor/', ARRAY['Corporate Law','Family Law','Criminal Law','Property Law','Employment Law'], 'Regulates solicitors in Scotland'),
  ('Law Society of Northern Ireland', 'LSNI', 'United Kingdom', 'https://www.lawsoc-ni.org', 'https://www.lawsoc-ni.org/solicitors', ARRAY['Corporate Law','Family Law','Criminal Law','Property Law'], 'Regulates solicitors in Northern Ireland'),
  ('Intellectual Property Regulation Board', 'IPReg', 'United Kingdom', 'https://ipreg.org.uk', 'https://ipreg.org.uk/find-a-regulated-person', ARRAY['Intellectual Property','Patent Law','Trademark Law'], 'Regulates patent and trademark attorneys'),
  ('Council for Licensed Conveyancers', 'CLC', 'United Kingdom', 'https://www.clc-uk.org', 'https://www.clc-uk.org/consumers/find-a-lawyer/', ARRAY['Property Law','Conveyancing'], 'Regulates licensed conveyancers'),
  ('Faculty of Advocates', 'FoA', 'United Kingdom', 'https://www.advocates.org.uk', 'https://www.advocates.org.uk/instructing-advocates/find-an-advocate', ARRAY['Criminal Law','Commercial Law','Family Law','Public Law'], 'Regulates advocates in Scotland');

-- Create payouts table for commission tracking
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL,
  firm_id uuid REFERENCES public.law_firms(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.legal_professionals(id) ON DELETE CASCADE,
  gross_amount numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0.20,
  commission_amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_transactions jsonb DEFAULT '[]'::jsonb,
  admin_notes text DEFAULT NULL,
  processed_by uuid DEFAULT NULL,
  processed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Users can request payouts"
  ON public.payouts FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can view all payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payouts"
  ON public.payouts FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for new tables
CREATE TRIGGER update_regulatory_bodies_updated_at
  BEFORE UPDATE ON public.regulatory_bodies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();