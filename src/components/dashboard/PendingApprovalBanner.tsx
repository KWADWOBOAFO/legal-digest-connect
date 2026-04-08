import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, ShieldAlert, LogOut, Settings } from 'lucide-react';

const PendingApprovalBanner = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile-settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
            <CardDescription className="text-base">
              Welcome, {profile?.full_name || 'there'}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your account has been created successfully, but it requires admin approval before you can access the platform's features.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">What happens next:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• An administrator will review your account</li>
                <li>• You'll receive an email once approved</li>
                <li>• After approval, you'll have full access to all features</li>
              </ul>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await refreshProfile();
              }}
            >
              Check Approval Status
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PendingApprovalBanner;
