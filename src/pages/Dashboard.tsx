import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import IndividualDashboard from '@/components/dashboard/IndividualDashboard';
import FirmDashboard from '@/components/dashboard/FirmDashboard';
import { Scale } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

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

  return profile.user_type === 'firm' ? <FirmDashboard /> : <IndividualDashboard />;
};

export default Dashboard;
