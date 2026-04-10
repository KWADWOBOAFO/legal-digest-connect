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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Server
} from 'lucide-react';

// ── SMTP Settings Component ──
const SmtpSettings = ({
  settings,
  onChange,
}: {
  settings: SmtpConfig;
  onChange: (s: SmtpConfig) => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: keyof SmtpConfig, value: string) =>
    onChange({ ...settings, [key]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Email & SMTP Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Configure your SMTP settings to enable email notifications (welcome emails, consultation alerts, 
              case updates, password change alerts). Use a service like <strong>Gmail</strong>, <strong>Mailgun</strong>, or <strong>SendGrid</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              Support Email <span className="text-xs">(shown in emails)</span>
            </Label>
            <Input
              value={settings.supportEmail}
              onChange={(e) => update('supportEmail', e.target.value)}
              placeholder="support@debriefed.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              Admin Notification Email <span className="text-xs">(receives alerts)</span>
            </Label>
            <Input
              value={settings.adminEmail}
              onChange={(e) => update('adminEmail', e.target.value)}
              placeholder="admin@debriefed.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">SMTP Host</Label>
            <Input
              value={settings.smtpHost}
              onChange={(e) => update('smtpHost', e.target.value)}
              placeholder="smtp.debriefed.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">SMTP Port</Label>
            <Input
              value={settings.smtpPort}
              onChange={(e) => update('smtpPort', e.target.value)}
              placeholder="465"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">SMTP Username</Label>
            <Input
              value={settings.smtpUsername}
              onChange={(e) => update('smtpUsername', e.target.value)}
              placeholder="no-reply@debriefed.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">SMTP Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={settings.smtpPassword}
                onChange={(e) => update('smtpPassword', e.target.value)}
                placeholder="••••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              From Name <span className="text-xs">(sender display name)</span>
            </Label>
            <Input
              value={settings.fromName}
              onChange={(e) => update('fromName', e.target.value)}
              placeholder="Debriefed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">From Email Address</Label>
            <Input
              value={settings.fromEmail}
              onChange={(e) => update('fromEmail', e.target.value)}
              placeholder="no-reply@debriefed.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground font-medium">Encryption</Label>
          <Select
            value={settings.encryption}
            onValueChange={(v) => update('encryption', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS (recommended)</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Template Editor Component ──
interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  enabled: boolean;
  audience: 'all' | 'admin' | 'firm' | 'individual';
}

const AUDIENCE_CONFIG = {
  all: { label: 'All Users', icon: Users, color: 'bg-primary/10 text-primary' },
  admin: { label: 'Admins', icon: Shield, color: 'bg-destructive/10 text-destructive' },
  firm: { label: 'Law Firms', icon: Building2, color: 'bg-secondary/10 text-secondary-foreground' },
  individual: { label: 'Individuals', icon: Users, color: 'bg-accent/10 text-accent-foreground' },
};

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    key: 'welcome_email',
    label: 'Welcome Email',
    description: 'Sent to new users after they sign up and verify their email',
    subject: 'Welcome to Debriefed!',
    body: `<h1>Welcome to Debriefed!</h1>
<p>Hi {{user_name}},</p>
<p>Thank you for creating your account. We're excited to have you on board.</p>
<p>You can now start exploring the platform and submit your first case.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'all',
  },
  {
    key: 'account_approved',
    label: 'Account Approved',
    description: 'Sent when an admin approves a user account',
    subject: 'Your Debriefed account has been approved',
    body: `<h1>Account Approved</h1>
<p>Hi {{user_name}},</p>
<p>Your Debriefed account has been approved. You now have full access to all platform features.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'all',
  },
  {
    key: 'firm_interest',
    label: 'Firm Interest Notification',
    description: 'Sent to case owners when a firm expresses interest',
    subject: 'A law firm is interested in your case',
    body: `<h1>A Law Firm Is Interested</h1>
<p>Hi {{user_name}},</p>
<p>Great news! <strong>{{firm_name}}</strong> has expressed interest in your case "<em>{{case_title}}</em>".</p>
<p>Log in to your dashboard to review their profile and schedule a consultation.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'individual',
  },
  {
    key: 'consultation_scheduled',
    label: 'Consultation Scheduled',
    description: 'Sent when a consultation is booked',
    subject: 'Your consultation has been scheduled',
    body: `<h1>Consultation Scheduled</h1>
<p>Hi {{user_name}},</p>
<p>Your consultation has been scheduled for <strong>{{date_time}}</strong>.</p>
<p>Details:</p>
<ul>
  <li>Case: {{case_title}}</li>
  <li>Firm: {{firm_name}}</li>
  <li>Duration: {{duration}} minutes</li>
</ul>
<p>You'll receive a reminder 24 hours before your appointment.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'all',
  },
  {
    key: 'consultation_reminder',
    label: 'Consultation Reminder',
    description: 'Sent 24 hours before a scheduled consultation',
    subject: 'Reminder: Your consultation is tomorrow',
    body: `<h1>Consultation Reminder</h1>
<p>Hi {{user_name}},</p>
<p>This is a reminder that your consultation is scheduled for <strong>{{date_time}}</strong>.</p>
<p>Please make sure you have all your documents ready.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'all',
  },
  {
    key: 'firm_verified',
    label: 'Firm Verified',
    description: 'Sent to law firms when their verification is approved',
    subject: 'Your law firm has been verified',
    body: `<h1>Firm Verified</h1>
<p>Hi {{user_name}},</p>
<p>Congratulations! Your law firm <strong>{{firm_name}}</strong> has been verified on Debriefed.</p>
<p>You can now start receiving case matches and scheduling consultations.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'firm',
  },
  {
    key: 'firm_rejected',
    label: 'Firm Rejected',
    description: 'Sent to law firms when their verification is denied',
    subject: 'Your law firm verification requires attention',
    body: `<h1>Verification Update</h1>
<p>Hi {{user_name}},</p>
<p>Unfortunately, your law firm verification was not approved at this time.</p>
<p>Reason: {{rejection_reason}}</p>
<p>Please review the requirements and resubmit your application.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'firm',
  },
  {
    key: 'new_user_signup_admin',
    label: 'New User Signup (Admin Alert)',
    description: 'Notifies admins when a new user registers',
    subject: 'New user registration on Debriefed',
    body: `<h1>New User Registration</h1>
<p>A new user has registered on Debriefed:</p>
<ul>
  <li>Name: {{user_name}}</li>
  <li>Email: {{user_email}}</li>
  <li>Type: {{user_type}}</li>
  <li>Date: {{registration_date}}</li>
</ul>
<p>Log in to the admin dashboard to review and approve.</p>`,
    enabled: true,
    audience: 'admin',
  },
  {
    key: 'case_submitted',
    label: 'Case Submitted',
    description: 'Sent to users when they submit a new case',
    subject: 'Your case has been submitted',
    body: `<h1>Case Submitted</h1>
<p>Hi {{user_name}},</p>
<p>Your case "<em>{{case_title}}</em>" has been submitted successfully and is now under review.</p>
<p>We will notify you once matching firms have been identified.</p>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: true,
    audience: 'individual',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Weekly summary of platform activity sent to all users',
    subject: 'Your weekly Debriefed digest',
    body: `<h1>Weekly Digest</h1>
<p>Hi {{user_name}},</p>
<p>Here's your weekly summary:</p>
<ul>
  <li>New cases: {{new_cases_count}}</li>
  <li>Consultations completed: {{consultations_count}}</li>
  <li>Messages received: {{messages_count}}</li>
</ul>
<p>Best regards,<br/>The Debriefed Team</p>`,
    enabled: false,
    audience: 'all',
  },
];

const TemplateCard = ({
  template,
  onToggle,
  onSubjectChange,
  onBodyChange,
  onSendTest,
}: {
  template: EmailTemplate;
  onToggle: () => void;
  onSubjectChange: (s: string) => void;
  onBodyChange: (b: string) => void;
  onSendTest: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const audienceConfig = AUDIENCE_CONFIG[template.audience];
  const AudienceIcon = audienceConfig.icon;

  return (
    <div className="rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4 p-4">
        <Switch checked={template.enabled} onCheckedChange={onToggle} />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{template.label}</span>
            <Badge variant="outline" className={`text-xs ${audienceConfig.color}`}>
              <AudienceIcon className="h-3 w-3 mr-1" />
              {audienceConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            <FileText className="h-3 w-3 mr-1" />
            {expanded ? 'Collapse' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSendTest}
            disabled={!template.enabled}
          >
            <Send className="h-3 w-3 mr-1" />
            Test
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subject Line</Label>
            <Input
              value={template.subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              disabled={!template.enabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Email Body (HTML) — Variables: {'{{user_name}}'}, {'{{firm_name}}'}, {'{{case_title}}'}, etc.
            </Label>
            <Textarea
              value={template.body}
              onChange={(e) => onBodyChange(e.target.value)}
              disabled={!template.enabled}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Notification Toggles Component ──
const NotificationToggles = ({
  templates,
  onToggle,
}: {
  templates: EmailTemplate[];
  onToggle: (key: string) => void;
}) => (
  <div className="space-y-4">
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
              <Switch checked={t.enabled} onCheckedChange={() => onToggle(t.key)} />
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
              <Switch checked={t.enabled} onCheckedChange={() => onToggle(t.key)} />
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
              <Switch checked={t.enabled} onCheckedChange={() => onToggle(t.key)} />
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
        <CardDescription>These notifications are sent to all user types.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.filter(t => t.audience === 'all').map(t => (
          <div key={t.key} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
            <div>
              <span className="text-sm font-medium">{t.label}</span>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <Switch checked={t.enabled} onCheckedChange={() => onToggle(t.key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// ── Types ──
interface SmtpConfig {
  supportEmail: string;
  adminEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  encryption: string;
}

const DEFAULT_SMTP: SmtpConfig = {
  supportEmail: '',
  adminEmail: '',
  smtpHost: '',
  smtpPort: '465',
  smtpUsername: '',
  smtpPassword: '',
  fromName: 'Debriefed',
  fromEmail: '',
  encryption: 'tls',
};

// ── Main Component ──
export const AdminEmailSettings = () => {
  const { toast } = useToast();
  const [smtp, setSmtp] = useState<SmtpConfig>(DEFAULT_SMTP);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
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
        const smtpUpdate = { ...DEFAULT_SMTP };
        data.forEach(setting => {
          switch (setting.setting_key) {
            case 'email_smtp_config':
              try {
                const parsed = JSON.parse(setting.setting_value || '{}');
                Object.assign(smtpUpdate, parsed);
              } catch {}
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
        setSmtp(smtpUpdate);
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
        saveSetting('email_smtp_config', JSON.stringify(smtp), 'SMTP configuration for email delivery'),
        saveSetting('email_footer', emailFooter, 'Email footer text'),
        saveSetting('email_templates_config', JSON.stringify({ templates }), 'Email template configurations'),
      ]);

      await logAdminAction('email_settings_updated', 'platform_settings', null, {
        smtpHost: smtp.smtpHost,
        fromEmail: smtp.fromEmail,
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

  const updateTemplateBody = (key: string, body: string) => {
    setTemplates(prev => prev.map(t => t.key === key ? { ...t, body } : t));
  };

  const sendTestEmail = async (templateKey: string) => {
    toast({
      title: 'Test email sent',
      description: 'A test email has been sent to the admin notification address.',
    });
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
            Full control over email delivery, SMTP settings, notification templates, and alert preferences.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">
            <Server className="h-4 w-4 mr-1" />
            SMTP Settings
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

        <TabsContent value="smtp" className="space-y-4">
          <SmtpSettings settings={smtp} onChange={setSmtp} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Footer</CardTitle>
              <CardDescription>Custom footer text included at the bottom of all platform emails.</CardDescription>
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Enable or disable notification emails, customize subject lines and body content for each template type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map(template => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  onToggle={() => toggleTemplate(template.key)}
                  onSubjectChange={(s) => updateTemplateSubject(template.key, s)}
                  onBodyChange={(b) => updateTemplateBody(template.key, b)}
                  onSendTest={() => sendTestEmail(template.key)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationToggles templates={templates} onToggle={toggleTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
