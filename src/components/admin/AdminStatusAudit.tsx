import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertTriangle, ShieldCheck, FileSignature, Bot, User, ShieldAlert, ShieldMinus,
  Search, CalendarIcon, Mail, MailCheck, MailX, RefreshCw, Clock, History,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminActivityLog';

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

interface FirmRow {
  id: string;
  firm_name: string;
  is_verified: boolean;
  nda_signed: boolean;
  regulatory_body: string | null;
  regulatory_number: string | null;
  user_id: string;
  verified_at: string | null;
  nda_signed_at: string | null;
}

interface Actor { user_id: string; email: string; full_name: string | null; }
interface EmailRow {
  id: string;
  firm_id: string;
  kind: string;
  idempotency_key: string;
  status: 'pending' | 'sent' | 'failed' | string;
  recipient_email: string | null;
  attempts: number;
  last_error: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const roleBadge = (role: string | null) => {
  switch (role) {
    case 'admin': return <Badge variant="destructive"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
    case 'firm_owner': return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Firm owner</Badge>;
    case 'system_trigger': return <Badge variant="outline"><Bot className="h-3 w-3 mr-1" />System</Badge>;
    default: return <Badge variant="outline">{role || 'unknown'}</Badge>;
  }
};

const fieldLabel = (field: string, newValue: boolean | null) => {
  if (field === 'nda_signed') return <span className="flex items-center gap-1"><FileSignature className="h-3.5 w-3.5" />NDA {newValue ? 'signed' : 'unsigned'}</span>;
  if (field === 'is_verified') return <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Verification {newValue ? 'granted' : 'revoked'}</span>;
  return field;
};

const emailStatusBadge = (row?: EmailRow) => {
  if (!row) return <Badge variant="outline" className="text-xs"><Mail className="h-3 w-3 mr-1" />Not sent</Badge>;
  if (row.status === 'sent') return <Badge className="bg-green-600 text-xs"><MailCheck className="h-3 w-3 mr-1" />Delivered</Badge>;
  if (row.status === 'failed') return <Badge variant="destructive" className="text-xs"><MailX className="h-3 w-3 mr-1" />Failed</Badge>;
  return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
};

export default function AdminStatusAudit() {
  const { toast } = useToast();
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [firms, setFirms] = useState<Record<string, FirmRow>>({});
  const [actors, setActors] = useState<Record<string, Actor>>({});
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);

  // Filters
  const [firmQuery, setFirmQuery] = useState('');
  const [actorQuery, setActorQuery] = useState('');
  const [regulator, setRegulator] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sourceQuery, setSourceQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Timeline drawer
  const [timelineFirmId, setTimelineFirmId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: auditData }, { data: firmsData }, { data: emailData }] = await Promise.all([
      supabase.from('firm_status_audit').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('law_firms').select('id, firm_name, is_verified, nda_signed, regulatory_body, regulatory_number, user_id, verified_at, nda_signed_at'),
      supabase.from('firm_verification_emails').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    const rows = (auditData || []) as AuditRow[];
    setAudit(rows);
    setEmails((emailData || []) as EmailRow[]);

    const fMap: Record<string, FirmRow> = {};
    ((firmsData || []) as FirmRow[]).forEach(f => { fMap[f.id] = f; });
    setFirms(fMap);

    const actorIds = Array.from(new Set(rows.map(r => r.changed_by).filter(Boolean))) as string[];
    if (actorIds.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, email, full_name').in('user_id', actorIds);
      const aMap: Record<string, Actor> = {};
      ((profs || []) as Actor[]).forEach(p => { aMap[p.user_id] = p; });
      setActors(aMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('firm-status-audit-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'firm_status_audit' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'law_firms' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'firm_verification_emails' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const inconsistent = useMemo(
    () => Object.values(firms).filter(f => f.is_verified && !f.nda_signed),
    [firms]
  );

  const filteredAudit = useMemo(() => {
    return audit.filter(row => {
      const firm = firms[row.firm_id];
      const actor = row.changed_by ? actors[row.changed_by] : null;

      if (firmQuery && !(firm?.firm_name || '').toLowerCase().includes(firmQuery.toLowerCase())) return false;
      if (regulator !== 'all' && (firm?.regulatory_body || '').toLowerCase() !== regulator.toLowerCase()) return false;
      if (fieldFilter !== 'all' && row.field !== fieldFilter) return false;
      if (roleFilter !== 'all' && (row.changed_by_role || '') !== roleFilter) return false;
      if (sourceQuery && !(row.source || '').toLowerCase().includes(sourceQuery.toLowerCase())) return false;
      if (actorQuery) {
        const hay = `${actor?.full_name || ''} ${actor?.email || ''}`.toLowerCase();
        if (!hay.includes(actorQuery.toLowerCase())) return false;
      }
      const t = new Date(row.created_at).getTime();
      if (dateFrom && t < dateFrom.getTime()) return false;
      if (dateTo && t > dateTo.getTime() + 86_400_000) return false;
      return true;
    });
  }, [audit, firms, actors, firmQuery, actorQuery, regulator, fieldFilter, roleFilter, sourceQuery, dateFrom, dateTo]);

  const regulatorOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(firms).forEach(f => { if (f.regulatory_body) set.add(f.regulatory_body); });
    return Array.from(set);
  }, [firms]);

  const latestVerificationEmailByFirm = useMemo(() => {
    const map: Record<string, EmailRow> = {};
    emails.forEach(e => {
      if (!map[e.firm_id] || new Date(e.created_at) > new Date(map[e.firm_id].created_at)) map[e.firm_id] = e;
    });
    return map;
  }, [emails]);

  // ---- Resolve inconsistency actions ----
  const resolveInconsistency = async (firm: FirmRow, action: 'unverify' | 'mark_nda_signed') => {
    setResolvingId(firm.id);
    try {
      // Tag the audit source so the trigger logs a human-readable cause
      const source = action === 'unverify'
        ? 'admin dashboard · resolve inconsistency (un-verify)'
        : 'admin dashboard · resolve inconsistency (mark NDA signed)';
      try {
        await (supabase.rpc as any)('set_config', { setting_name: 'app.audit_source', new_value: source, is_local: true });
      } catch { /* set_config is optional; trigger still logs default source */ }

      const patch = action === 'unverify'
        ? { is_verified: false }
        : { nda_signed: true, nda_signed_at: new Date().toISOString() };

      const { error } = await supabase.from('law_firms').update(patch).eq('id', firm.id);
      if (error) throw error;

      await logAdminAction(
        action === 'unverify' ? 'firm_verification_revoked_resolve' : 'firm_nda_marked_signed_resolve',
        'firm',
        firm.id,
        { firmName: firm.firm_name, reason: 'Inconsistency resolution' }
      );

      toast({
        title: 'Inconsistency resolved',
        description: action === 'unverify'
          ? `${firm.firm_name} has been un-verified.`
          : `${firm.firm_name} is now recorded as having signed the NDA.`,
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setResolvingId(null);
    }
  };

  // ---- Idempotent email retry ----
  const retryConfirmationEmail = async (firm: FirmRow) => {
    if (!firm.is_verified) {
      toast({ title: 'Firm is not verified', description: 'Only verified firms can receive a confirmation email.', variant: 'destructive' });
      return;
    }
    const owner = actors[firm.user_id];
    const { data: prof } = await supabase.from('profiles').select('email, full_name').eq('user_id', firm.user_id).maybeSingle();
    const email = prof?.email || owner?.email;
    if (!email) {
      toast({ title: 'No recipient email', description: 'Firm owner has no email on file.', variant: 'destructive' });
      return;
    }

    // Idempotency key ties email to the firm's current verification stamp — same key = no duplicate send
    const stamp = firm.verified_at ? new Date(firm.verified_at).getTime() : 'unknown';
    const idempotencyKey = `firm-verified-${firm.id}-${stamp}`;
    setRetryingKey(idempotencyKey);

    // Reset row to pending so realtime UI reflects retry state (upsert also happens server-side)
    await supabase.from('firm_verification_emails').upsert({
      firm_id: firm.id,
      kind: 'firm_verified',
      idempotency_key: idempotencyKey,
      recipient_email: email,
      status: 'pending',
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: 'idempotency_key' });

    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'firm_verified',
        recipientEmail: email,
        recipientName: prof?.full_name || 'Law Firm Representative',
        idempotencyKey,
        firmId: firm.id,
        data: { firmName: firm.firm_name },
      },
    });
    setRetryingKey(null);

    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Confirmation email sent', description: `Delivered to ${email}.` });
    }
    await load();
  };

  const timelineRows = useMemo(
    () => timelineFirmId ? audit.filter(a => a.firm_id === timelineFirmId) : [],
    [audit, timelineFirmId]
  );
  const timelineFirm = timelineFirmId ? firms[timelineFirmId] : null;

  return (
    <div className="space-y-4">
      {/* Inconsistency card with resolve actions */}
      <Card className={inconsistent.length > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-emerald-500/40 bg-emerald-50/40'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {inconsistent.length > 0
              ? <><ShieldAlert className="h-5 w-5 text-destructive" /> Consistency check: attention needed</>
              : <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Consistency check: all clear</>}
          </CardTitle>
          <CardDescription>
            {inconsistent.length > 0
              ? `${inconsistent.length} firm(s) marked verified without a signed NDA. Choose a resolution — the change is written to the audit log.`
              : 'No firms are verified without a signed NDA.'}
          </CardDescription>
        </CardHeader>
        {inconsistent.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {inconsistent.map(f => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-background">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium mr-auto">{f.firm_name}</span>
                  <Button size="sm" variant="outline" onClick={() => setTimelineFirmId(f.id)}>
                    <History className="h-4 w-4 mr-1" /> Timeline
                  </Button>
                  <Button size="sm" variant="secondary" disabled={resolvingId === f.id}
                    onClick={() => resolveInconsistency(f, 'mark_nda_signed')}>
                    <FileSignature className="h-4 w-4 mr-1" /> Mark NDA signed
                  </Button>
                  <Button size="sm" variant="destructive" disabled={resolvingId === f.id}
                    onClick={() => resolveInconsistency(f, 'unverify')}>
                    <ShieldMinus className="h-4 w-4 mr-1" /> Un-verify
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters & search</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Firm name…" value={firmQuery} onChange={e => setFirmQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Admin/actor name or email…" value={actorQuery} onChange={e => setActorQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={regulator} onValueChange={setRegulator}>
            <SelectTrigger><SelectValue placeholder="Regulator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regulators</SelectItem>
              {regulatorOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fields</SelectItem>
              <SelectItem value="nda_signed">NDA signed</SelectItem>
              <SelectItem value="is_verified">Verification</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="Actor role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="firm_owner">Firm owner</SelectItem>
              <SelectItem value="system_trigger">System / trigger</SelectItem>
              <SelectItem value="other_authenticated">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Trigger / source contains…" value={sourceQuery} onChange={e => setSourceQuery(e.target.value)} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateFrom ? format(dateFrom, 'dd MMM yyyy') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateTo ? format(dateTo, 'dd MMM yyyy') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent>
          </Popover>
          {(firmQuery || actorQuery || regulator !== 'all' || fieldFilter !== 'all' || roleFilter !== 'all' || sourceQuery || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => {
              setFirmQuery(''); setActorQuery(''); setRegulator('all'); setFieldFilter('all');
              setRoleFilter('all'); setSourceQuery(''); setDateFrom(undefined); setDateTo(undefined);
            }}>Clear filters</Button>
          )}
        </CardContent>
      </Card>

      {/* Email delivery status per firm */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Confirmation email delivery</CardTitle>
          <CardDescription>Idempotent per firm — retries reuse the same key and never send duplicates.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.values(firms).filter(f => f.is_verified).length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified firms yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.values(firms).filter(f => f.is_verified).map(f => {
                const row = latestVerificationEmailByFirm[f.id];
                const stamp = f.verified_at ? new Date(f.verified_at).getTime() : 'unknown';
                const key = `firm-verified-${f.id}-${stamp}`;
                const isRetrying = retryingKey === key;
                return (
                  <div key={f.id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border">
                    <span className="font-medium mr-auto">{f.firm_name}</span>
                    {emailStatusBadge(row)}
                    {row?.sent_at && <span className="text-xs text-muted-foreground">Sent {format(new Date(row.sent_at), 'dd MMM HH:mm')}</span>}
                    {row?.last_error && <span className="text-xs text-destructive line-clamp-1 max-w-xs" title={row.last_error}>· {row.last_error}</span>}
                    <Button size="sm" variant="outline" disabled={isRetrying} onClick={() => retryConfirmationEmail(f)}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                      {row?.status === 'sent' ? 'Resend' : 'Retry'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle>Status Audit Log</CardTitle>
          <CardDescription>
            Showing {filteredAudit.length} of {audit.length} changes. Click a row for the firm's full timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes match the current filters.</p>
          ) : (
            <div className="space-y-3">
              {filteredAudit.map(row => {
                const actor = row.changed_by ? actors[row.changed_by] : null;
                const firm = firms[row.firm_id];
                return (
                  <button
                    key={row.id}
                    onClick={() => setTimelineFirmId(row.firm_id)}
                    className="w-full text-left flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg border hover:bg-accent/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{firm?.firm_name || 'Unknown firm'}</span>
                        <Badge variant={row.new_value ? 'default' : 'secondary'} className="text-xs">{fieldLabel(row.field, row.new_value)}</Badge>
                        {firm?.regulatory_body && <Badge variant="outline" className="text-xs">{firm.regulatory_body}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {String(row.old_value)} → {String(row.new_value)}
                        {row.source ? ` · ${row.source}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {roleBadge(row.changed_by_role)}
                      {actor && <span>{actor.full_name || actor.email}</span>}
                      <span className="tabular-nums">{format(new Date(row.created_at), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firm timeline drawer */}
      <Sheet open={!!timelineFirmId} onOpenChange={(o) => !o && setTimelineFirmId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> {timelineFirm?.firm_name || 'Firm timeline'}
            </SheetTitle>
            <SheetDescription>
              Every NDA and verification change in chronological order, with the exact trigger/source that caused it.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {timelineFirm && (
              <div className="p-3 rounded-lg border bg-muted/40 text-sm space-y-1">
                <div className="flex gap-2 items-center">
                  <span className="font-medium">Current:</span>
                  <Badge variant={timelineFirm.nda_signed ? 'default' : 'secondary'} className="text-xs">
                    NDA {timelineFirm.nda_signed ? 'signed' : 'unsigned'}
                  </Badge>
                  <Badge variant={timelineFirm.is_verified ? 'default' : 'outline'} className="text-xs">
                    {timelineFirm.is_verified ? 'Verified' : 'Not verified'}
                  </Badge>
                </div>
                {timelineFirm.regulatory_body && (
                  <p className="text-xs text-muted-foreground">
                    Regulator: {timelineFirm.regulatory_body} · {timelineFirm.regulatory_number || '—'}
                  </p>
                )}
              </div>
            )}
            <ol className="relative border-l-2 border-muted ml-3 space-y-4">
              {timelineRows.length === 0 && (
                <li className="ml-4 text-sm text-muted-foreground">No recorded changes for this firm.</li>
              )}
              {timelineRows.map(row => {
                const actor = row.changed_by ? actors[row.changed_by] : null;
                return (
                  <li key={row.id} className="ml-6">
                    <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 ring-4 ring-background" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={row.new_value ? 'default' : 'secondary'} className="text-xs">{fieldLabel(row.field, row.new_value)}</Badge>
                      {roleBadge(row.changed_by_role)}
                      <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(row.created_at), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                    <p className="text-sm mt-1">
                      <span className="font-mono">{String(row.old_value)}</span> → <span className="font-mono">{String(row.new_value)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.source || 'No source recorded'}
                      {actor && <> · by {actor.full_name || actor.email}</>}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
