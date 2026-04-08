import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ArrowLeft, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Consultation {
  id: string;
  case_id: string;
  firm_id: string;
  user_id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminConsultationsDetail() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [firms, setFirms] = useState<Record<string, string>>({});
  const [caseTitles, setCaseTitles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { if (!roleLoading && !isAdmin) navigate('/admin'); }, [isAdmin, roleLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
    const ch = supabase.channel('admin-consultations-detail').on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const fetchData = async () => {
    const { data } = await supabase.from('consultations').select('*').order('scheduled_at', { ascending: false });
    const c = data || [];
    setConsultations(c);

    const userIds = [...new Set(c.map(x => x.user_id))];
    const firmIds = [...new Set(c.map(x => x.firm_id))];
    const caseIds = [...new Set(c.map(x => x.case_id))];

    const [{ data: p }, { data: f }, { data: cs }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds.length ? userIds : ['']),
      supabase.from('law_firms').select('id, firm_name').in('id', firmIds.length ? firmIds : ['']),
      supabase.from('cases').select('id, title').in('id', caseIds.length ? caseIds : ['']),
    ]);

    if (p) { const m: Record<string, string> = {}; p.forEach(x => { m[x.user_id] = x.full_name || x.email; }); setProfiles(m); }
    if (f) { const m: Record<string, string> = {}; f.forEach(x => { m[x.id] = x.firm_name; }); setFirms(m); }
    if (cs) { const m: Record<string, string> = {}; cs.forEach(x => { m[x.id] = x.title; }); setCaseTitles(m); }
    setIsLoading(false);
  };

  const statusCounts = consultations.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});

  const filtered = consultations.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (profiles[c.user_id] || '').toLowerCase().includes(term) || (firms[c.firm_id] || '').toLowerCase().includes(term) || (caseTitles[c.case_id] || '').toLowerCase().includes(term);
    }
    return true;
  });

  if (roleLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Consultations Overview</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{consultations.length}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.scheduled || 0}</p><p className="text-sm text-muted-foreground">Scheduled</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.in_progress || 0}</p><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.completed || 0}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.cancelled || 0}</p><p className="text-sm text-muted-foreground">Cancelled</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by user, firm, or case..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Consultations ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No consultations found.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Firm</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{caseTitles[c.case_id] || c.case_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{profiles[c.user_id] || c.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{firms[c.firm_id] || c.firm_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge className={`text-xs capitalize ${statusColors[c.status] || ''}`}>{c.status.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-sm">{format(new Date(c.scheduled_at), 'dd MMM yyyy, HH:mm')}</TableCell>
                        <TableCell className="text-sm">{c.duration_minutes || 30} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
