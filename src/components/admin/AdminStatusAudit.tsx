import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, FileSignature, Bot, User, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface AuditRow {
  id: string;
  firm_id: string;
  field: 'nda_signed' | 'is_verified' | string;
  old_value: boolean | null;
  new_value: boolean | null;
  changed_by: string | null;
  changed_by_role: string | null;
  source: string | null;
  created_at: string;
}

interface InconsistentRow {
  id: string;
  firm_name: string;
  is_verified: boolean;
  nda_signed: boolean;
  verified_at: string | null;
  nda_signed_at: string | null;
}

interface FirmName { id: string; firm_name: string; }
interface Actor { user_id: string; email: string; full_name: string | null; }

const roleBadge = (role: string | null) => {
  switch (role) {
    case 'admin': return <Badge variant="destructive"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
    case 'firm_owner': return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Firm owner</Badge>;
    case 'system_trigger': return <Badge variant="outline"><Bot className="h-3 w-3 mr-1" />System</Badge>;
    default: return <Badge variant="outline">{role || 'unknown'}</Badge>;
  }
};

const fieldLabel = (field: string, newValue: boolean | null) => {
  if (field === 'nda_signed') {
    return <span className="flex items-center gap-1"><FileSignature className="h-3.5 w-3.5" />NDA {newValue ? 'signed' : 'unsigned'}</span>;
  }
  if (field === 'is_verified') {
    return <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Verification {newValue ? 'granted' : 'revoked'}</span>;
  }
  return field;
};

export default function AdminStatusAudit() {
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [firms, setFirms] = useState<Record<string, string>>({});
  const [actors, setActors] = useState<Record<string, Actor>>({});
  const [inconsistent, setInconsistent] = useState<InconsistentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: auditData }, { data: inconsistentData }] = await Promise.all([
      supabase.from('firm_status_audit').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('inconsistent_firm_statuses').select('*'),
    ]);

    const rows = (auditData || []) as AuditRow[];
    setAudit(rows);
    setInconsistent((inconsistentData || []) as InconsistentRow[]);

    const firmIds = Array.from(new Set(rows.map(r => r.firm_id)));
    const actorIds = Array.from(new Set(rows.map(r => r.changed_by).filter(Boolean))) as string[];

    const [firmsRes, profilesRes] = await Promise.all([
      firmIds.length
        ? supabase.from('law_firms').select('id, firm_name').in('id', firmIds)
        : Promise.resolve({ data: [] as FirmName[] }),
      actorIds.length
        ? supabase.from('profiles').select('user_id, email, full_name').in('user_id', actorIds)
        : Promise.resolve({ data: [] as Actor[] }),
    ]);

    const fMap: Record<string, string> = {};
    ((firmsRes.data || []) as FirmName[]).forEach(f => { fMap[f.id] = f.firm_name; });
    setFirms(fMap);

    const aMap: Record<string, Actor> = {};
    ((profilesRes.data || []) as Actor[]).forEach(p => { aMap[p.user_id] = p; });
    setActors(aMap);

    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('firm-status-audit-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'firm_status_audit' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'law_firms' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Inconsistency banner */}
      <Card className={inconsistent.length > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-emerald-500/40 bg-emerald-50/40'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {inconsistent.length > 0 ? (
              <><ShieldAlert className="h-5 w-5 text-destructive" /> Consistency check: attention needed</>
            ) : (
              <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Consistency check: all clear</>
            )}
          </CardTitle>
          <CardDescription>
            {inconsistent.length > 0
              ? `${inconsistent.length} firm(s) are marked verified without a signed NDA. Investigate and resolve.`
              : 'No firms are verified without a signed NDA. Nightly job runs at 02:00 UTC; this panel updates in real time.'}
          </CardDescription>
        </CardHeader>
        {inconsistent.length > 0 && (
          <CardContent>
            <ul className="space-y-2">
              {inconsistent.map(f => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">{f.firm_name}</span>
                  <Badge variant="outline" className="text-xs">Verified: {f.verified_at ? format(new Date(f.verified_at), 'dd MMM yyyy HH:mm') : '—'}</Badge>
                  <Badge variant="outline" className="text-xs">NDA: not signed</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle>Status Audit Log</CardTitle>
          <CardDescription>
            Every change to NDA and verification flags, with actor and cause. Updates live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {audit.map(row => {
                const actor = row.changed_by ? actors[row.changed_by] : null;
                return (
                  <div key={row.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{firms[row.firm_id] || 'Unknown firm'}</span>
                        <Badge variant={row.new_value ? 'default' : 'secondary'} className="text-xs">
                          {fieldLabel(row.field, row.new_value)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {String(row.old_value)} → {String(row.new_value)}
                        {row.source ? ` · ${row.source}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {roleBadge(row.changed_by_role)}
                      {actor && <span>{actor.full_name || actor.email}</span>}
                      <span className="tabular-nums">{format(new Date(row.created_at), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
