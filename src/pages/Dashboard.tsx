import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import IndividualDashboard from '@/components/dashboard/IndividualDashboard';
import FirmDashboard from '@/components/dashboard/FirmDashboard';
import UserTypeSelector from '@/components/onboarding/UserTypeSelector';
import { Scale } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [needsTypeSelection, setNeedsTypeSelection] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Redirect admins to admin panel
  useEffect(() => {
    if (!roleLoading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, roleLoading, navigate]);

  // Check if this is a first-time OAuth user who hasn't chosen their type
  useEffect(() => {
    if (user && profile) {
      const metadata = user.user_metadata;
      const hasSelectedType = metadata?.user_type_selected === true || metadata?.user_type;
      // OAuth users won't have user_type in metadata unless set during email signup or type selection
      const isOAuthUser = user.app_metadata?.provider === 'google' || user.app_metadata?.provider === 'apple' ||
        (user.identities ?? []).some(i => i.provider === 'google' || i.provider === 'apple');
      
      setNeedsTypeSelection(isOAuthUser && !hasSelectedType);
    }
  }, [user, profile]);

  if (isLoading || roleLoading || needsTypeSelection === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (needsTypeSelection) {
    return <UserTypeSelector />;
  }

  return profile.user_type === 'firm' ? <FirmDashboard /> : <IndividualDashboard />;
};

export default Dashboard;
