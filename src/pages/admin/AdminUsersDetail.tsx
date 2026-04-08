import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ArrowLeft, Search, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  location: string | null;
  phone: string | null;
  created_at: string;
}

export default function AdminUsersDetail() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { if (!roleLoading && !isAdmin) navigate('/admin'); }, [isAdmin, roleLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
    const ch = supabase.channel('admin-users-detail').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const fetchData = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setIsLoading(false);
  };

  const individuals = profiles.filter(p => p.user_type === 'individual');
  const firmUsers = profiles.filter(p => p.user_type === 'firm');

  const filtered = profiles.filter(p => {
    if (typeFilter !== 'all' && p.user_type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.email.toLowerCase().includes(term) || (p.full_name || '').toLowerCase().includes(term);
    }
    return true;
  });

  if (roleLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Users Overview</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{profiles.length}</p><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{individuals.length}</p><p className="text-sm text-muted-foreground">Individuals</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{firmUsers.length}</p><p className="text-sm text-muted-foreground">Firm Users</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All Types</option>
                <option value="individual">Individuals ({individuals.length})</option>
                <option value="firm">Firm Users ({firmUsers.length})</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Users ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No users found.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>
                          <Badge variant={p.user_type === 'firm' ? 'default' : 'secondary'} className="text-xs capitalize">
                            {p.user_type === 'firm' && <Building2 className="h-3 w-3 mr-1" />}
                            {p.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.location || '—'}</TableCell>
                        <TableCell className="text-sm">{p.phone || '—'}</TableCell>
                        <TableCell className="text-sm">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
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
