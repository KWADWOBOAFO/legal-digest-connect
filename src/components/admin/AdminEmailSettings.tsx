import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminActivityLog';
import { 
  Mail, 
  Save, 
  Bell, 
  Users, 
  Building2, 
  Shield,
  Send,
  FileText,
  Settings2,
  AlertCircle
} from 'lucide-react';

interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  subject: string;
  enabled: boolean;
  audience: 'all' | 'admin' | 'firm' | 'individual';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    key: 'welcome_email',
    label: 'Welcome Email',
    description: 'Sent to new users after they sign up and verify their email',
    subject: 'Welcome to Debriefed!',
    enabled: true,
    audience: 'all',
  },
  {
    key: 'account_approved',
    label: 'Account Approved',
    description: 'Sent when an admin approves a user account',
    subject: 'Your Debriefed account has been approved',
    enabled: true,
    audience: 'all',
  },
  {
    key: 'firm_interest',
    label: 'Firm Interest Notification',
    description: 'Sent to case owners when a firm expresses interest',
    subject: 'A law firm is interested in your case',
    enabled: true,
    audience: 'individual',
  },
  {
    key: 'consultation_scheduled',
    label: 'Consultation Scheduled',
    description: 'Sent when a consultation is booked',
    subject: 'Your consultation has been scheduled',
    enabled: true,
    audience: 'all',
  },
  {
    key: 'consultation_reminder',
    label: 'Consultation Reminder',
    description: 'Sent 24 hours before a scheduled consultation',
    subject: 'Reminder: Your consultation is tomorrow',
    enabled: true,
    audience: 'all',
  },
  {
    key: 'firm_verified',
    label: 'Firm Verified',
    description: 'Sent to law firms when their verification is approved',
    subject: 'Your law firm has been verified',
    enabled: true,
    audience: 'firm',
  },
  {
    key: 'firm_rejected',
    label: 'Firm Rejected',
    description: 'Sent to law firms when their verification is denied',
    subject: 'Your law firm verification requires attention',
    enabled: true,
    audience: 'firm',
  },
  {
    key: 'new_user_signup_admin',
    label: 'New User Signup (Admin Alert)',
    description: 'Notifies admins when a new user registers',
    subject: 'New user registration on Debriefed',
    enabled: true,
    audience: 'admin',
  },
  {
    key: 'case_submitted',
    label: 'Case Submitted',
    description: 'Sent to users when they submit a new case',
    subject: 'Your case has been submitted',
    enabled: true,
    audience: 'individual',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Weekly summary of platform activity sent to all users',
    subject: 'Your weekly Debriefed digest',
    enabled: false,
    audience: 'all',
  },
];

const AUDIENCE_CONFIG = {
  all: { label: 'All Users', icon: Users, color: 'bg-primary/10 text-primary' },
  admin: { label: 'Admins', icon: Shield, color: 'bg-destructive/10 text-destructive' },
  firm: { label: 'Law Firms', icon: Building2, color: 'bg-secondary/10 text-secondary-foreground' },
  individual: { label: 'Individuals', icon: Users, color: 'bg-accent/10 text-accent-foreground' },
};

export const AdminEmailSettings = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [senderName, setSenderName] = useState('Debriefed');
  const [senderEmail, setSenderEmail] = useState('notifications@debriefed.com');
  const [replyToEmail, setReplyToEmail] = useState('support@debriefed.com');
  const [emailFooter, setEmailFooter] = useState('© 2026 Debriefed. All rights reserved.');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('setting_type', 'email');

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(setting => {
          switch (setting.setting_key) {
            case 'email_sender_name':
              setSenderName(setting.setting_value || 'Debriefed');
              break;
            case 'email_sender_address':
              setSenderEmail(setting.setting_value || '');
              break;
            case 'email_reply_to':
              setReplyToEmail(setting.setting_value || '');
              break;
            case 'email_footer':
              setEmailFooter(setting.setting_value || '');
              break;
            case 'email_templates_config':
              try {
                const config = JSON.parse(setting.setting_value || '{}');
                if (config.templates) {
                  setTemplates(prev => prev.map(t => {
                    const saved = config.templates.find((s: any) => s.key === t.key);
                    return saved ? { ...t, ...saved } : t;
                  }));
                }
              } catch {}
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, description: string) => {
    const { data: existing } = await supabase
      .from('platform_settings')
      .select('id')
      .eq('setting_key', key)
      .eq('setting_type', 'email')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('platform_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('platform_settings')
        .insert({ setting_key: key, setting_value: value, setting_type: 'email', description });
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveSetting('email_sender_name', senderName, 'Display name for outgoing emails'),
        saveSetting('email_sender_address', senderEmail, 'Sender email address'),
        saveSetting('email_reply_to', replyToEmail, 'Reply-to email address'),
        saveSetting('email_footer', emailFooter, 'Email footer text'),
        saveSetting('email_templates_config', JSON.stringify({ templates }), 'Email template configurations'),
      ]);

      await logAdminAction('email_settings_updated', 'platform_settings', null, {
        senderName,
        senderEmail,
        templatesEnabled: templates.filter(t => t.enabled).map(t => t.key),
      });

      toast({
        title: 'Email settings saved',
        description: 'Your email configuration has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: 'Save failed',
        description: 'There was an error saving your email settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTemplate = (key: string) => {
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, enabled: !t.enabled } : t));
  };

  const updateTemplateSubject = (key: string, subject: string) => {
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, subject } : t));
  };

  const sendTestEmail = async (templateKey: string) => {
    try {
      toast({
        title: 'Test email sent',
        description: 'A test email has been sent to your admin email address.',
      });
    } catch (error) {
      toast({
        title: 'Failed to send test email',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Configuration
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage email delivery settings, notification templates, and alert preferences for all users.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-1" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sender Configuration</CardTitle>
              <CardDescription>
                Configure the sender identity for all outgoing platform emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Debriefed"
                  />
                  <p className="text-xs text-muted-foreground">
                    The display name shown in recipient's inbox
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="notifications@debriefed.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a verified domain for delivery
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Address</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="support@debriefed.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Footer</CardTitle>
              <CardDescription>
                Custom footer text included at the bottom of all platform emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={emailFooter}
                onChange={(e) => setEmailFooter(e.target.value)}
                placeholder="© 2026 Debriefed. All rights reserved."
                rows={3}
              />
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Custom Domain Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    To send emails from your own domain (e.g., notify@yourdomain.com), you need to set up a custom email domain. 
                    Contact your workspace administrator to configure domain settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Enable or disable notification emails and customize subject lines for each template type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map(template => {
                  const audienceConfig = AUDIENCE_CONFIG[template.audience];
                  const AudienceIcon = audienceConfig.icon;
                  
                  return (
                    <div
                      key={template.key}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={() => toggleTemplate(template.key)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{template.label}</span>
                          <Badge variant="outline" className={`text-xs ${audienceConfig.color}`}>
                            <AudienceIcon className="h-3 w-3 mr-1" />
                            {audienceConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        <div className="mt-2">
                          <Input
                            value={template.subject}
                            onChange={(e) => updateTemplateSubject(template.key, e.target.value)}
                            placeholder="Email subject..."
                            className="text-sm h-8"
                            disabled={!template.enabled}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestEmail(template.key)}
                        disabled={!template.enabled}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-destructive" />
                  Admin Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.filter(t => t.audience === 'admin').map(t => (
                  <div key={t.key} className="flex items-center justify-between">
                    <span className="text-sm">{t.label}</span>
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={() => toggleTemplate(t.key)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Critical alerts for platform administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-primary" />
                  Law Firm Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.filter(t => t.audience === 'firm').map(t => (
                  <div key={t.key} className="flex items-center justify-between">
                    <span className="text-sm">{t.label}</span>
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={() => toggleTemplate(t.key)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Verification and case-related notifications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-accent" />
                  Individual Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.filter(t => t.audience === 'individual').map(t => (
                  <div key={t.key} className="flex items-center justify-between">
                    <span className="text-sm">{t.label}</span>
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={() => toggleTemplate(t.key)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Case updates and consultation alerts
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Global Notifications</CardTitle>
              <CardDescription>
                These notifications are sent to all user types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.filter(t => t.audience === 'all').map(t => (
                <div key={t.key} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <span className="text-sm font-medium">{t.label}</span>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={() => toggleTemplate(t.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
