import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformPaymentConfig {
  payments_enabled: boolean;
  currency: string;
  consultation_fee: string;
  booking_fee: string;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['Up to 5 case matches per month', 'Basic firm profile', 'Video consultations', 'Client reviews & ratings'],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 99,
    annualPrice: 79,
    features: ['Unlimited case matches', 'Priority listing in search', 'Advanced analytics', 'AI-powered case insights', 'Document sharing', 'Calendar integrations', 'Dedicated support'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    features: ['Everything in Professional', 'Multi-seat team access', 'Custom branding', 'API access', 'SLA guarantees', 'Dedicated account manager'],
  },
];

const SubscriptionCheckout = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'professional';
  const billingParam = searchParams.get('billing') as 'monthly' | 'annual' || 'annual';
  const [billing, setBilling] = useState<'monthly' | 'annual'>(billingParam);
  const [paymentConfig, setPaymentConfig] = useState<PlatformPaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const selectedPlan = plans.find(p => p.id === planId) || plans[1];

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('setting_type', 'payment');

      if (data) {
        const config: any = {};
        data.forEach(row => { config[row.setting_key] = row.setting_value; });
        setPaymentConfig({
          payments_enabled: config.payments_enabled === 'true',
          currency: config.currency || 'GBP',
          consultation_fee: config.consultation_fee || '50.00',
          booking_fee: config.booking_fee || '10.00',
        });
      }
    } catch (e) {
      console.error('Error fetching payment config:', e);
    }
  };

  const currencySymbol = paymentConfig?.currency === 'EUR' ? '€' : paymentConfig?.currency === 'USD' ? '$' : '£';

  const price = billing === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!paymentConfig?.payments_enabled) {
      toast({
        title: 'Payments not configured',
        description: 'Payment processing is currently being set up. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create a pending payment transaction
      const { error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          amount: price || 0,
          currency: paymentConfig.currency,
          payment_type: 'subscription',
          status: 'pending',
          description: `${selectedPlan.name} Plan - ${billing === 'monthly' ? 'Monthly' : 'Annual'} Subscription`,
          metadata: {
            plan: selectedPlan.id,
            billing_cycle: billing,
          },
        } as any);

      if (error) throw error;

      toast({
        title: 'Subscription initiated',
        description: 'Your subscription request has been submitted. Payment processing will be completed once the payment gateway is fully configured.',
      });

      navigate('/dashboard');
    } catch (e) {
      console.error('Subscription error:', e);
      toast({
        title: 'Error',
        description: 'Failed to process subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/pricing')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscribe to {selectedPlan.name}</CardTitle>
                <CardDescription>
                  Review your plan details and complete your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Billing Toggle */}
                <div>
                  <p className="text-sm font-medium mb-3">Billing Cycle</p>
                  <div className="inline-flex items-center rounded-full bg-background border border-border p-1">
                    <button
                      onClick={() => setBilling('monthly')}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                        billing === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBilling('annual')}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1',
                        billing === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Annual
                      <Badge variant="outline" className="text-xs bg-accent/20 text-accent border-accent/30">
                        Save 20%
                      </Badge>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Plan Features */}
                <div>
                  <p className="text-sm font-medium mb-3">What's included</p>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedPlan.id === 'starter' && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <p className="text-sm font-medium">14-day free trial included</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No credit card required. Full access to all Starter features.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {!paymentConfig?.payments_enabled && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Payment gateway setup in progress</p>
                      <p className="text-sm text-amber-700 mt-1">
                        The payment processor is being configured by the administrator. You can subscribe now and payment will be processed once setup is complete.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Price Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{selectedPlan.name} Plan</span>
                  <span className="font-medium">
                    {price === null ? 'Custom' : price === 0 ? 'Free' : `${currencySymbol}${price}`}
                    {price !== null && price > 0 && <span className="text-muted-foreground">/mo</span>}
                  </span>
                </div>

                {billing === 'annual' && price !== null && price > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billed annually</span>
                    <span className="font-medium">{currencySymbol}{(price * 12).toFixed(2)}/yr</span>
                  </div>
                )}

                {billing === 'annual' && selectedPlan.monthlyPrice !== null && selectedPlan.monthlyPrice > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Annual savings</span>
                    <span className="font-medium">
                      -{currencySymbol}{((selectedPlan.monthlyPrice - (selectedPlan.annualPrice || 0)) * 12).toFixed(2)}/yr
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {price === null ? 'Custom' : price === 0 ? 'Free' : `${currencySymbol}${price}/mo`}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                {selectedPlan.id === 'enterprise' ? (
                  <Button className="w-full" size="lg" onClick={() => navigate('/about')}>
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="gold"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isLoading ? 'Processing...' : price === 0 ? 'Start Free Trial' : 'Subscribe Now'}
                  </Button>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Secure payment • Cancel anytime</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
