import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Scale, ArrowLeft, Save, Loader2, User, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ProfileSettings = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [userType, setUserType] = useState<'individual' | 'firm'>('individual');
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false);
  const [pendingType, setPendingType] = useState<'individual' | 'firm'>('individual');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setUserType(profile.user_type as 'individual' | 'firm');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          location,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChangeRequest = (newType: 'individual' | 'firm') => {
    if (newType === userType) return;
    setPendingType(newType);
    setShowTypeChangeDialog(true);
  };

  const confirmTypeChange = async () => {
    if (!user) return;
    setIsSaving(true);
    setShowTypeChangeDialog(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: pendingType })
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { user_type: pendingType, user_type_selected: true }
      });

      await refreshProfile();
      setUserType(pendingType);

      toast({
        title: 'Account type changed',
        description: pendingType === 'firm'
          ? 'Your account is now a law firm account. Please complete firm onboarding.'
          : 'Your account is now an individual account.',
      });

      if (pendingType === 'firm') {
        navigate('/firm-onboarding');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to change account type.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Profile Settings</h1>

        {/* Personal Info */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name, phone, and location.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" />
            </div>
            <Button variant="gold" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Account Type */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
            <CardDescription>Change how you use the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={userType} onValueChange={(v) => handleTypeChangeRequest(v as 'individual' | 'firm')}>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <RadioGroupItem value="individual" id="type-individual" className="mt-1" />
                <Label htmlFor="type-individual" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">Individual</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Submit cases and get matched with law firms for free consultations.</p>
                </Label>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-accent/30 transition-colors">
                <RadioGroupItem value="firm" id="type-firm" className="mt-1" />
                <Label htmlFor="type-firm" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Law Firm</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Register your firm, receive case matches, and grow your client base.</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showTypeChangeDialog} onOpenChange={setShowTypeChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Change Account Type
            </DialogTitle>
            <DialogDescription>
              {pendingType === 'firm'
                ? "You're switching to a Law Firm account. You'll need to complete the firm onboarding process to start receiving case matches."
                : "You're switching to an Individual account. You'll lose access to firm features like case matching and the firm dashboard."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTypeChangeDialog(false)}>Cancel</Button>
            <Button variant="gold" onClick={confirmTypeChange} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettings;
