import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, ArrowLeft, Search, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Case {
  id: string;
  title: string;
  status: string;
  urgency_level: string | null;
  assigned_practice_area: string | null;
  moderation_status: string | null;
  created_at: string;
  user_id: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  matched: 'bg-blue-100 text-blue-800',
  consultation_scheduled: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminCasesDetail() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [cases, setCases] = useState<Case[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { if (!roleLoading && !isAdmin) navigate('/admin'); }, [isAdmin, roleLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
    const ch = supabase.channel('admin-cases-detail').on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const fetchData = async () => {
    const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
    const c = data || [];
    setCases(c);
    if (c.length > 0) {
      const { data: p } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', [...new Set(c.map(x => x.user_id))]);
      if (p) { const m: Record<string, string> = {}; p.forEach(x => { m[x.user_id] = x.full_name || x.email; }); setProfiles(m); }
    }
    setIsLoading(false);
  };

  const statusCounts = cases.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});

  const filtered = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (profiles[c.user_id] || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return matchesSearch;
  });

  if (roleLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6" /> Cases Overview</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{cases.length}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status}><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{count}</p><p className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</p></CardContent></Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title or user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All Statuses</option>
                {Object.keys(statusCounts).map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Cases ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No cases found.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Practice Area</TableHead>
                      <TableHead>Moderation</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/case/${c.id}`)}>
                        <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                        <TableCell className="text-sm">{profiles[c.user_id] || c.user_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge className={`text-xs capitalize ${statusColors[c.status] || ''}`}>{c.status.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-sm capitalize">{c.urgency_level || 'normal'}</TableCell>
                        <TableCell className="text-sm">{c.assigned_practice_area || '—'}</TableCell>
                        <TableCell className="text-sm capitalize">{c.moderation_status || 'pending'}</TableCell>
                        <TableCell className="text-sm">{format(new Date(c.created_at), 'dd MMM yyyy')}</TableCell>
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
