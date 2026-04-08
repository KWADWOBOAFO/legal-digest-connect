import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ArrowLeft, Search, Building2, CheckCircle2, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  location: string | null;
  phone: string | null;
  created_at: string;
  is_approved: boolean;
  approved_at: string | null;
}

export default function AdminUsersDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const handleApproval = async (profileUserId: string, approve: boolean) => {
    setActionLoading(profileUserId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: approve,
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: approve ? user?.id : null
        })
        .eq('user_id', profileUserId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: profileUserId,
        type: 'account_approval',
        title: approve ? 'Account Approved' : 'Account Approval Revoked',
        message: approve
          ? 'Your account has been approved by an administrator. You now have full access to the platform.'
          : 'Your account approval has been revoked. Please contact support for more information.',
      });

      const targetProfile = profiles.find(p => p.user_id === profileUserId);
      if (targetProfile) {
        supabase.functions.invoke('send-notification-email', {
          body: {
            type: approve ? 'account_approved' : 'account_revoked',
            recipientEmail: targetProfile.email,
            recipientName: targetProfile.full_name || 'User',
            data: {}
          }
        }).catch(err => console.error('Failed to send email:', err));
      }

      toast({
        title: approve ? 'User Approved' : 'Approval Revoked',
        description: approve
          ? 'The user can now access all platform features.'
          : 'The user\'s access has been restricted.',
      });

      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update approval status.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (approve: boolean) => {
    if (selectedUsers.size === 0) return;
    setBulkLoading(true);
    try {
      const userIds = Array.from(selectedUsers);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: approve,
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: approve ? user?.id : null
        })
        .in('user_id', userIds);

      if (error) throw error;

      // Send notifications to all affected users
      const notifications = userIds.map(uid => ({
        user_id: uid,
        type: 'account_approval',
        title: approve ? 'Account Approved' : 'Account Approval Revoked',
        message: approve
          ? 'Your account has been approved by an administrator. You now have full access to the platform.'
          : 'Your account approval has been revoked. Please contact support for more information.',
      }));

      await supabase.from('notifications').insert(notifications);

      toast({
        title: `Bulk ${approve ? 'Approval' : 'Revocation'} Complete`,
        description: `${userIds.length} user(s) have been ${approve ? 'approved' : 'revoked'}.`,
      });

      setSelectedUsers(new Set());
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk action failed.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map(p => p.user_id)));
    }
  };

  const individuals = profiles.filter(p => p.user_type === 'individual');
  const firmUsers = profiles.filter(p => p.user_type === 'firm');
  const pendingApproval = profiles.filter(p => !p.is_approved);
  const approved = profiles.filter(p => p.is_approved);

  const filtered = profiles.filter(p => {
    if (typeFilter !== 'all' && p.user_type !== typeFilter) return false;
    if (approvalFilter === 'approved' && !p.is_approved) return false;
    if (approvalFilter === 'pending' && p.is_approved) return false;
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{profiles.length}</p><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{individuals.length}</p><p className="text-sm text-muted-foreground">Individuals</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{firmUsers.length}</p><p className="text-sm text-muted-foreground">Firm Users</p></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50/50"><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-amber-600">{pendingApproval.length}</p><p className="text-sm text-muted-foreground">Pending Approval</p></CardContent></Card>
          <Card className="border-green-200 bg-green-50/50"><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-600">{approved.length}</p><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
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
                <option value="individual">Individuals</option>
                <option value="firm">Firm Users</option>
              </select>
              <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval ({pendingApproval.length})</option>
                <option value="approved">Approved ({approved.length})</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedUsers.size} user(s) selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction(true)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction(false)}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Revoke Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>All Users ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No users found.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filtered.length > 0 && selectedUsers.size === filtered.length}
                          onCheckedChange={toggleAllFiltered}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id} className={selectedUsers.has(p.user_id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(p.user_id)}
                            onCheckedChange={() => toggleUserSelection(p.user_id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>
                          <Badge variant={p.user_type === 'firm' ? 'default' : 'secondary'} className="text-xs capitalize">
                            {p.user_type === 'firm' && <Building2 className="h-3 w-3 mr-1" />}
                            {p.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.is_approved ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{p.location || '—'}</TableCell>
                        <TableCell className="text-sm">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!p.is_approved ? (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={actionLoading === p.user_id}
                                onClick={() => handleApproval(p.user_id, true)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30"
                                disabled={actionLoading === p.user_id}
                                onClick={() => handleApproval(p.user_id, false)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Revoke
                              </Button>
                            )}
                          </div>
                        </TableCell>
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
