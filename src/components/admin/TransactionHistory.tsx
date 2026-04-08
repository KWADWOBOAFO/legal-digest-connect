import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  RefreshCw,
  Eye,
  ArrowUpDown,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  user_id: string;
  firm_id: string | null;
  consultation_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  stripe_payment_id: string | null;
  stripe_refund_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const currencySymbols: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [firms, setFirms] = useState<Record<string, string>>({});

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const txs = (data || []) as Transaction[];
      setTransactions(txs);

      // Fetch related profiles and firms
      const userIds = [...new Set(txs.map(t => t.user_id))];
      const firmIds = [...new Set(txs.map(t => t.firm_id).filter(Boolean))] as string[];

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        if (profileData) {
          const map: Record<string, string> = {};
          profileData.forEach(p => { map[p.user_id] = p.full_name || p.email; });
          setProfiles(map);
        }
      }

      if (firmIds.length > 0) {
        const { data: firmData } = await supabase
          .from('law_firms')
          .select('id, firm_name')
          .in('id', firmIds);
        if (firmData) {
          const map: Record<string, string> = {};
          firmData.forEach(f => { map[f.id] = f.firm_name; });
          setFirms(map);
        }
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('admin-transactions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, fetchTransactions)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleSort = (field: 'created_at' | 'amount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filtered = transactions
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (typeFilter !== 'all' && t.payment_type !== typeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (t.description || '').toLowerCase().includes(term) ||
          (t.stripe_payment_id || '').toLowerCase().includes(term) ||
          (profiles[t.user_id] || '').toLowerCase().includes(term) ||
          (t.firm_id && (firms[t.firm_id] || '').toLowerCase().includes(term))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const valA = sortField === 'amount' ? a.amount : new Date(a.created_at).getTime();
      const valB = sortField === 'amount' ? b.amount : new Date(b.created_at).getTime();
      return sortAsc ? valA - valB : valB - valA;
    });

  // Summary stats
  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0);
  const totalRefunded = transactions.filter(t => t.status === 'refunded').reduce((s, t) => s + Number(t.amount), 0);
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">£{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
                <p className="text-xl font-bold">£{totalRefunded.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">£{pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, firm, description, or payment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="booking">Booking</option>
              <option value="refund">Refund</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            All payment transactions on the platform, updated in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                {transactions.length === 0
                  ? 'Transactions will appear here once payments are processed.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Date <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('amount')}
                    >
                      <div className="flex items-center gap-1">
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {profiles[tx.user_id] || tx.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.firm_id ? (firms[tx.firm_id] || tx.firm_id.slice(0, 8)) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {tx.payment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {currencySymbols[tx.currency] || tx.currency}{Number(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize text-xs ${statusColors[tx.status] || ''}`}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTx(tx)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTx.created_at), 'dd MMM yyyy, HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`capitalize ${statusColors[selectedTx.status] || ''}`}>
                    {selectedTx.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold font-mono">
                    {currencySymbols[selectedTx.currency] || selectedTx.currency}
                    {Number(selectedTx.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedTx.payment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{profiles[selectedTx.user_id] || selectedTx.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Firm</p>
                  <p className="font-medium">
                    {selectedTx.firm_id ? (firms[selectedTx.firm_id] || selectedTx.firm_id) : '—'}
                  </p>
                </div>
              </div>
              {selectedTx.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTx.description}</p>
                </div>
              )}
              {selectedTx.stripe_payment_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Stripe Payment ID</p>
                  <p className="font-mono text-sm">{selectedTx.stripe_payment_id}</p>
                </div>
              )}
              {selectedTx.stripe_refund_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Stripe Refund ID</p>
                  <p className="font-mono text-sm">{selectedTx.stripe_refund_id}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
