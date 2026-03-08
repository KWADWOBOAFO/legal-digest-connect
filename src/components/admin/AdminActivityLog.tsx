import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Shield, ShieldPlus, ShieldMinus, CheckCircle2, XCircle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface LogEntry {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  role_added: { icon: ShieldPlus, label: 'Role Added', variant: 'default' },
  role_removed: { icon: ShieldMinus, label: 'Role Removed', variant: 'destructive' },
  firm_verified: { icon: CheckCircle2, label: 'Firm Verified', variant: 'default' },
  firm_rejected: { icon: XCircle, label: 'Firm Rejected', variant: 'destructive' },
  case_approved: { icon: FileText, label: 'Case Approved', variant: 'default' },
  case_rejected: { icon: FileText, label: 'Case Rejected', variant: 'destructive' },
  case_moderated: { icon: FileText, label: 'Case Moderated', variant: 'secondary' },
};

const AdminActivityLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [admins, setAdmins] = useState<Record<string, AdminProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'get_activity_log' },
      });
      if (error) throw error;
      setLogs(data.logs || []);
      const adminMap: Record<string, AdminProfile> = {};
      (data.admins || []).forEach((a: AdminProfile) => { adminMap[a.user_id] = a; });
      setAdmins(adminMap);
    } catch (err) {
      console.error('Failed to fetch activity log:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const getActionDisplay = (log: LogEntry) => {
    const config = actionConfig[log.action_type] || { icon: Activity, label: log.action_type, variant: 'outline' as const };
    const Icon = config.icon;
    return { Icon, label: config.label, variant: config.variant };
  };

  const getDetails = (log: LogEntry): string => {
    const parts: string[] = [];
    const d = log.details as Record<string, string>;
    if (d.role) parts.push(`Role: ${d.role}`);
    if (d.firmName) parts.push(`Firm: ${d.firmName}`);
    if (d.caseTitle) parts.push(`Case: ${d.caseTitle}`);
    if (d.reason) parts.push(`Reason: ${d.reason}`);
    return parts.join(' · ') || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>Track all admin actions across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {logs.map((log) => {
                const { Icon, label, variant } = getActionDisplay(log);
                const admin = admins[log.admin_id];
                const details = getDetails(log);
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={variant} className="text-xs">{label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{admin?.full_name || admin?.email || 'Unknown admin'}</span>
                        {log.target_id && <span className="text-muted-foreground"> → {log.target_type} {log.target_id.substring(0, 8)}…</span>}
                      </p>
                      {details && <p className="text-xs text-muted-foreground mt-0.5">{details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminActivityLog;
