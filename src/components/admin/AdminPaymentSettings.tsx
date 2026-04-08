import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Settings,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentSettings {
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  consultation_fee: string;
  booking_fee: string;
  platform_commission: string;
  currency: string;
  payments_enabled: string;
  test_mode: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  stripe_publishable_key: '',
  stripe_secret_key: '',
  stripe_webhook_secret: '',
  consultation_fee: '50.00',
  booking_fee: '10.00',
  platform_commission: '15',
  currency: 'GBP',
  payments_enabled: 'false',
  test_mode: 'true',
};

export function AdminPaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('setting_type', 'payment');

      if (error) throw error;

      if (data && data.length > 0) {
        const loaded = { ...DEFAULT_SETTINGS };
        data.forEach((row) => {
          const key = row.setting_key as keyof PaymentSettings;
          if (key in loaded) {
            loaded[key] = row.setting_value || '';
          }
        });
        setSettings(loaded);
      }
    } catch (e) {
      console.error('Error loading payment settings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        const { data: existing } = await supabase
          .from('platform_settings')
          .select('id')
          .eq('setting_key', key)
          .eq('setting_type', 'payment')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('platform_settings')
            .update({ setting_value: value, updated_by: user.id })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('platform_settings')
            .insert({
              setting_key: key,
              setting_value: value,
              setting_type: 'payment',
              description: `Payment setting: ${key}`,
              updated_by: user.id,
            });
        }
      }

      toast({ title: 'Payment settings saved', description: 'Your payment configuration has been updated.' });
    } catch (e) {
      console.error('Error saving settings:', e);
      toast({ title: 'Error saving settings', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof PaymentSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const paymentsEnabled = settings.payments_enabled === 'true';
  const testMode = settings.test_mode === 'true';
  const hasStripeKeys = settings.stripe_publishable_key.length > 0 && settings.stripe_secret_key.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={paymentsEnabled ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {paymentsEnabled ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className="font-semibold">
                  {paymentsEnabled ? 'Payments are active' : 'Payments are disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testMode ? 'Running in test mode' : 'Running in live mode'}
                  {!hasStripeKeys && ' • Stripe keys not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="payments-toggle" className="text-sm">Enable Payments</Label>
                <Switch
                  id="payments-toggle"
                  checked={paymentsEnabled}
                  onCheckedChange={(checked) => updateSetting('payments_enabled', checked ? 'true' : 'false')}
                />
              </div>
              {paymentsEnabled && (
                <Badge variant={testMode ? 'outline' : 'default'} className={testMode ? 'border-amber-500 text-amber-700' : ''}>
                  {testMode ? 'Test Mode' : 'Live Mode'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe API Configuration
          </CardTitle>
          <CardDescription>
            Enter your Stripe API keys to enable payment processing. You can find these in your Stripe Dashboard under Developers → API keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="test-mode" className="text-sm">Test Mode</Label>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={(checked) => updateSetting('test_mode', checked ? 'true' : 'false')}
            />
            <span className="text-xs text-muted-foreground ml-2">
              {testMode ? 'Using test keys (no real charges)' : 'Using live keys (real charges!)'}
            </span>
          </div>

          <div>
            <Label className="text-sm">Publishable Key</Label>
            <Input
              value={settings.stripe_publishable_key}
              onChange={(e) => updateSetting('stripe_publishable_key', e.target.value)}
              placeholder={testMode ? 'pk_test_...' : 'pk_live_...'}
              className="font-mono text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">Secret Key</Label>
            <div className="relative mt-1">
              <Input
                type={showSecretKey ? 'text' : 'password'}
                value={settings.stripe_secret_key}
                onChange={(e) => updateSetting('stripe_secret_key', e.target.value)}
                placeholder={testMode ? 'sk_test_...' : 'sk_live_...'}
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm">Webhook Secret</Label>
            <div className="relative mt-1">
              <Input
                type={showWebhookSecret ? 'text' : 'password'}
                value={settings.stripe_webhook_secret}
                onChange={(e) => updateSetting('stripe_webhook_secret', e.target.value)}
                placeholder="whsec_..."
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Fees
          </CardTitle>
          <CardDescription>
            Configure consultation fees, booking charges, and platform commission rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Currency</Label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Consultation Fee</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {settings.currency === 'GBP' ? '£' : settings.currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.consultation_fee}
                  onChange={(e) => updateSetting('consultation_fee', e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Base fee per consultation</p>
            </div>

            <div>
              <Label className="text-sm">Booking Fee</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {settings.currency === 'GBP' ? '£' : settings.currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.booking_fee}
                  onChange={(e) => updateSetting('booking_fee', e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">One-time appointment booking fee</p>
            </div>

            <div>
              <Label className="text-sm">Platform Commission</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={settings.platform_commission}
                  onChange={(e) => updateSetting('platform_commission', e.target.value)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Commission on each transaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </div>
    </div>
  );
}
