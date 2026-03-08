import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Scale, Building2, User, ArrowLeft, Briefcase, Shield } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthView = 'login' | 'signup' | 'forgot-password';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: AuthView;
  initialUserType?: 'individual' | 'firm';
}

const AuthDialog = ({ open, onOpenChange, initialView, initialUserType }: AuthDialogProps) => {
  const [view, setView] = useState<AuthView>(initialView || 'login');
  const [userType, setUserType] = useState<'individual' | 'firm'>(initialUserType || 'individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Determine if we're in "firm mode" based on context
  const isFirmMode = userType === 'firm' || (initialUserType === 'firm' && view === 'login');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (view !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    if (view === 'signup') {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (view === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Reset failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a password reset link."
          });
          setView('login');
          resetForm();
        }
      } else if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in."
          });
          resetForm();
          onOpenChange(false);
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName, userType);
        if (error) {
          let errorMessage = error.message;
          if (error.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please log in instead.';
          }
          toast({
            title: "Sign up failed",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account created!",
            description: userType === 'firm' 
              ? "Welcome to DEBRIEFED. Complete your firm profile to get started."
              : "Welcome to DEBRIEFED. Let's get started."
          });
          resetForm();
          onOpenChange(false);
          // Firm users go to onboarding, individuals go to dashboard
          navigate(userType === 'firm' ? '/firm-onboarding' : '/dashboard');
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync initial props when dialog opens
  React.useEffect(() => {
    if (open) {
      if (initialView) setView(initialView);
      if (initialUserType) setUserType(initialUserType);
    }
  }, [open, initialView, initialUserType]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      setView(initialView || 'login');
    }
    onOpenChange(newOpen);
  };

  const getDialogTitle = () => {
    if (view === 'forgot-password') return 'Reset Password';
    if (view === 'login') {
      return isFirmMode ? 'Firm Portal' : 'Welcome Back';
    }
    return isFirmMode ? 'Register Your Firm' : 'Join DEBRIEFED';
  };

  const getDialogDescription = () => {
    if (view === 'forgot-password') return "Enter your email and we'll send you a reset link";
    if (view === 'login') {
      return isFirmMode 
        ? 'Sign in to access your firm dashboard and case matches' 
        : 'Sign in to access your dashboard';
    }
    return isFirmMode 
      ? 'Create your firm account to start receiving qualified cases'
      : 'Create your account to get started';
  };

  const HeaderIcon = isFirmMode ? Building2 : Scale;
  const headerIconColor = isFirmMode ? 'text-accent' : 'text-primary';
  const headerBgClass = isFirmMode 
    ? 'bg-gradient-to-b from-accent/10 to-transparent' 
    : 'bg-gradient-to-b from-primary/5 to-transparent';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {/* Styled Header */}
        <div className={`px-6 pt-6 pb-4 ${headerBgClass}`}>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className={`p-3 rounded-2xl ${isFirmMode ? 'bg-accent/15' : 'bg-primary/10'}`}>
                <HeaderIcon className={`h-8 w-8 ${headerIconColor}`} />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center font-serif">
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription className="text-center">
              {getDialogDescription()}
            </DialogDescription>
            {isFirmMode && view === 'login' && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Shield className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs text-muted-foreground">NDA-protected platform</span>
              </div>
            )}
          </DialogHeader>
        </div>
        
        <div className="px-6 pb-6">
          {view === 'forgot-password' && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2"
              onClick={() => {
                setView('login');
                setErrors({});
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Button>
          )}

          {view !== 'forgot-password' && (
            <>
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {view === 'signup' && (
            <Tabs value={userType} onValueChange={(v) => setUserType(v as 'individual' | 'firm')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="firm" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Law Firm
                </TabsTrigger>
              </TabsList>
              <TabsContent value="individual" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Get your legal matter analyzed and connect with qualified legal professionals.
                </p>
              </TabsContent>
              <TabsContent value="firm" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Access pre-qualified cases matching your practice areas and grow your client base.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Case matching</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> NDA protected</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="dialog-fullName">
                  {userType === 'firm' ? 'Firm Name' : 'Full Name'}
                </Label>
                <Input
                  id="dialog-fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={userType === 'firm' ? 'Smith & Associates LLP' : 'John Smith'}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="dialog-email">Email</Label>
              <Input
                id="dialog-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isFirmMode ? 'firm@lawfirm.com' : 'you@example.com'}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            {view !== 'forgot-password' && (
              <div className="space-y-2">
                <Label htmlFor="dialog-password">Password</Label>
                <Input
                  id="dialog-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {view === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setView('forgot-password');
                  setErrors({});
                }}
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              variant="gold"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Please wait...' 
                : view === 'login' 
                  ? (isFirmMode ? 'Sign In to Firm Portal' : 'Sign In')
                  : view === 'signup' 
                    ? (isFirmMode ? 'Register Firm' : 'Create Account')
                    : 'Send Reset Link'
              }
            </Button>
          </form>
          
          {view !== 'forgot-password' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setView(view === 'login' ? 'signup' : 'login');
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {view === 'login' 
                  ? (isFirmMode ? "New firm? Register here" : "Don't have an account? Sign up")
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
