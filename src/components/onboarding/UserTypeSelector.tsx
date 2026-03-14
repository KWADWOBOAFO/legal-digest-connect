import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserTypeSelector = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async (userType: 'individual' | 'firm') => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: userType })
        .eq('user_id', user.id);

      if (error) throw error;

      // Mark that user has chosen their type
      await supabase.auth.updateUser({
        data: { user_type: userType, user_type_selected: true }
      });

      await refreshProfile();

      toast({
        title: 'Welcome!',
        description: userType === 'firm'
          ? 'Let's set up your law firm profile.'
          : 'You're all set to submit your first case.',
      });

      if (userType === 'firm') {
        navigate('/firm-onboarding');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save your selection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome to DEBRIEFED</h1>
          <p className="text-muted-foreground mt-2">How will you be using the platform?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer border-2 border-border hover:border-primary/50 transition-all hover:shadow-card-hover"
            onClick={() => !isSubmitting && handleSelect('individual')}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">I Need Legal Help</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Submit your case and get matched with qualified law firms for a free consultation.
              </CardDescription>
              <Button
                variant="gold"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                Continue as Individual
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 border-border hover:border-accent/50 transition-all hover:shadow-card-hover"
            onClick={() => !isSubmitting && handleSelect('firm')}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-lg">I'm a Law Firm</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Register your firm, receive case matches, and grow your client base.
              </CardDescription>
              <Button
                variant="outline"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                Continue as Law Firm
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelector;
