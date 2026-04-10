import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PaymentStatsCards from './PaymentStatsCards';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string | null;
  created_at: string;
  firm_id: string | null;
  consultation_id: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Refunded', icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
};

const currencySymbol = (c: string) => {
  switch (c) { case 'GBP': return '£'; case 'EUR': return '€'; default: return '$'; }
};

interface Props {
  userType: 'individual' | 'firm';
}

const UserPaymentHistory = ({ userType }: Props) => {
  const { user, lawFirm } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalPaid: transactions
      .filter(t => t.status === 'completed' && t.payment_type !== 'payout')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    totalReceived: transactions
      .filter(t => t.status === 'completed' && t.payment_type === 'payout')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    pendingPayments: transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    transactionCount: transactions.length,
    currency: transactions[0]?.currency || 'GBP',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6 h-20 animate-pulse bg-muted/50" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentStatsCards stats={stats} userType={userType} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            {userType === 'firm'
              ? 'All payments and earnings for your firm'
              : 'Your payment history for consultations and services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">
                {userType === 'firm'
                  ? 'Payments from clients will appear here'
                  : 'Your consultation payments will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const sc = statusConfig[tx.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                const isPayout = tx.payment_type === 'payout';
                const sym = currencySymbol(tx.currency);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        isPayout ? 'bg-green-100' : 'bg-destructive/10'
                      )}>
                        {isPayout
                          ? <ArrowDownLeft className="h-5 w-5 text-green-600" />
                          : <ArrowUpRight className="h-5 w-5 text-destructive" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {tx.description || tx.payment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs', sc.className)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {sc.label}
                      </Badge>
                      <span className={cn(
                        'font-bold text-sm',
                        isPayout ? 'text-green-600' : 'text-foreground'
                      )}>
                        {isPayout ? '+' : '-'}{sym}{Number(tx.amount).toFixed(2)}
                      </span>
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
};

export default UserPaymentHistory;
