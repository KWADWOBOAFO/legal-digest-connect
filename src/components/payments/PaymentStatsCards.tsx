import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface PaymentStats {
  totalPaid: number;
  totalReceived: number;
  pendingPayments: number;
  transactionCount: number;
  currency: string;
}

const currencySymbol = (c: string) => {
  switch (c) {
    case 'GBP': return '£';
    case 'EUR': return '€';
    default: return '$';
  }
};

interface Props {
  stats: PaymentStats;
  userType: 'individual' | 'firm';
}

const PaymentStatsCards = ({ stats, userType }: Props) => {
  const sym = currencySymbol(stats.currency);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sym}{stats.totalPaid.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {userType === 'firm' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sym}{stats.totalReceived.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sym}{stats.pendingPayments.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.transactionCount}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatsCards;
