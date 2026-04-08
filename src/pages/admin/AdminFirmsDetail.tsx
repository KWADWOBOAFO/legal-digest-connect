import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Building2, CheckCircle2, Clock, XCircle, ArrowLeft, Search, Shield,
} from 'lucide-react';
import { format } from 'date-fns';

interface Firm {
  id: string;
  firm_name: string;
  is_verified: boolean;
  nda_signed: boolean;
  practice_areas: string[];
  city: string | null;
  country: string | null;
  created_at: string;
  user_id: string;
  regulatory_body: string | null;
  regulatory_number: string | null;
}

export default function AdminFirmsDetail() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; full_name: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate('/admin');
  }, [isAdmin, roleLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
    const channel = supabase
      .channel('admin-firms-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'law_firms' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fetchData = async () => {
    const { data: firmsData } = await supabase.from('law_firms').select('*').order('created_at', { ascending: false });
    const f = firmsData || [];
    setFirms(f);

    if (f.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('user_id, email, full_name').in('user_id', f.map(x => x.user_id));
      if (profilesData) {
        const map: Record<string, { email: string; full_name: string | null }> = {};
        profilesData.forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
    setIsLoading(false);
  };

  const verified = firms.filter(f => f.is_verified);
  const pending = firms.filter(f => f.nda_signed && !f.is_verified);
  const notStarted = firms.filter(f => !f.nda_signed);

  const filtered = firms.filter(f => {
    const matchesSearch = f.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profiles[f.user_id]?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'verified') return matchesSearch && f.is_verified;
    if (statusFilter === 'pending') return matchesSearch && f.nda_signed && !f.is_verified;
    if (statusFilter === 'not_started') return matchesSearch && !f.nda_signed;
    return matchesSearch;
  });

  if (roleLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Firms Overview
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard icon={<Building2 className="h-5 w-5 text-primary" />} label="Total Firms" value={firms.length} bg="bg-primary/10" />
          <SummaryCard icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} label="Verified" value={verified.length} bg="bg-green-100" pct={firms.length > 0 ? Math.round((verified.length / firms.length) * 100) : 0} />
          <SummaryCard icon={<Clock className="h-5 w-5 text-amber-600" />} label="Pending Review" value={pending.length} bg="bg-amber-100" pct={firms.length > 0 ? Math.round((pending.length / firms.length) * 100) : 0} />
          <SummaryCard icon={<XCircle className="h-5 w-5 text-muted-foreground" />} label="NDA Not Signed" value={notStarted.length} bg="bg-muted" pct={firms.length > 0 ? Math.round((notStarted.length / firms.length) * 100) : 0} />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by firm name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All ({firms.length})</option>
                <option value="verified">Verified ({verified.length})</option>
                <option value="pending">Pending ({pending.length})</option>
                <option value="not_started">NDA Not Signed ({notStarted.length})</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Firms Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Firms ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No firms found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firm Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Practice Areas</TableHead>
                      <TableHead>Regulatory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.firm_name}</TableCell>
                        <TableCell className="text-sm">{profiles[f.user_id]?.email || '—'}</TableCell>
                        <TableCell className="text-sm">{[f.city, f.country].filter(Boolean).join(', ') || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(f.practice_areas || []).slice(0, 2).map((a, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                            {(f.practice_areas || []).length > 2 && <Badge variant="outline" className="text-xs">+{f.practice_areas.length - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {f.regulatory_body ? (
                            <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{f.regulatory_body}: {f.regulatory_number}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {f.is_verified ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Verified</Badge>
                          ) : f.nda_signed ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Pending</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Not Started</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(f.created_at), 'dd MMM yyyy')}</TableCell>
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

function SummaryCard({ icon, label, value, bg, pct }: { icon: React.ReactNode; label: string; value: number; bg: string; pct?: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {pct !== undefined && <p className="text-xs text-muted-foreground">{pct}%</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
