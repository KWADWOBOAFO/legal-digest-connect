import { useState } from 'react';
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
import { Scale, Building2, User, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthView = 'login' | 'signup' | 'forgot-password';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [view, setView] = useState<AuthView>('login');
  const [userType, setUserType] = useState<'individual' | 'firm'>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
            description: "Welcome to DEBRIEFED. Let's get started."
          });
          resetForm();
          onOpenChange(false);
          navigate('/dashboard');
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      setView('login');
    }
    onOpenChange(newOpen);
  };

  const getDialogTitle = () => {
    switch (view) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Join DEBRIEFED';
      case 'forgot-password':
        return 'Reset Password';
    }
  };

  const getDialogDescription = () => {
    switch (view) {
      case 'login':
        return 'Sign in to access your dashboard';
      case 'signup':
        return 'Create your account to get started';
      case 'forgot-password':
        return "Enter your email and we'll send you a reset link";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Scale className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="text-center">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
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
                <p className="text-sm text-muted-foreground">
                  Access pre-qualified cases matching your practice areas and grow your client base.
                </p>
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
                placeholder="you@example.com"
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
                  ? 'Sign In' 
                  : view === 'signup' 
                    ? 'Create Account' 
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
                  ? "Don't have an account? Sign up" 
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
