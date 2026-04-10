import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, ShieldAlert, LogOut, Settings, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ApprovalState = 'pending' | 'approved' | 'checking';

const PendingApprovalBanner = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approvalState, setApprovalState] = useState<ApprovalState>('pending');

  // Real-time listener for profile approval changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`approval-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as { is_approved?: boolean };
          if (updated.is_approved === true) {
            setApprovalState('approved');
            toast({
              title: "Account Approved! 🎉",
              description: "Your account has been approved. Redirecting to your dashboard...",
            });
            // Refresh profile in context, then navigate
            refreshProfile().then(() => {
              setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCheckStatus = async () => {
    setApprovalState('checking');
    try {
      await refreshProfile();
      // After refresh, check if profile is now approved
      // We need to re-query since refreshProfile updates context asynchronously
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.is_approved) {
          setApprovalState('approved');
          toast({
            title: "Account Approved! 🎉",
            description: "Your account has been approved. Redirecting to your dashboard...",
          });
          await refreshProfile();
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
        } else {
          setApprovalState('pending');
          toast({
            title: "Still Pending",
            description: "Your account is still awaiting admin approval. You'll be notified automatically when approved.",
          });
        }
      }
    } catch {
      setApprovalState('pending');
      toast({
        title: "Error",
        description: "Could not check approval status. Please try again.",
        variant: "destructive"
      });
    }
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
        {approvalState === 'approved' ? (
          <Card className="text-center border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Account Approved!</CardTitle>
              <CardDescription className="text-base text-green-700">
                Welcome, {profile?.full_name || 'there'}! Your account is now active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">Redirecting you to your dashboard...</p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
            </CardContent>
          </Card>
        ) : (
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
                  <li>• You'll be notified automatically when approved</li>
                  <li>• After approval, you'll have full access to all features</li>
                </ul>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Listening for approval updates in real-time
              </div>
              <Button
                variant="outline"
                disabled={approvalState === 'checking'}
                onClick={handleCheckStatus}
              >
                {approvalState === 'checking' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check Approval Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PendingApprovalBanner;
