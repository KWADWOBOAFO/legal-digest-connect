import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FirmOnboarding from '@/components/dashboard/FirmOnboarding';
import { Scale } from 'lucide-react';

const FirmOnboardingPage = () => {
  const { user, profile, lawFirm, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // If firm already exists and NDA is signed, redirect to dashboard
  useEffect(() => {
    if (!isLoading && lawFirm?.nda_signed) {
      navigate('/dashboard');
    }
  }, [lawFirm, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <FirmOnboarding 
      lawFirm={lawFirm ? { id: lawFirm.id, firm_name: lawFirm.firm_name, is_verified: lawFirm.is_verified, nda_signed: lawFirm.nda_signed } : null}
      onComplete={() => refreshProfile()}
    />
  );
};

export default FirmOnboardingPage;
