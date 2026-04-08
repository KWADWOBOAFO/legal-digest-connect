import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Briefcase,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalFirms: number;
  verifiedFirms: number;
  pendingFirms: number;
  unverifiedFirms: number;
  totalCases: number;
  pendingCases: number;
  matchedCases: number;
  completedCases: number;
  totalConsultations: number;
  scheduledConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  totalUsers: number;
  individualUsers: number;
  firmUsers: number;
  totalReviews: number;
  averageRating: number;
}

type WidgetType = 'firms' | 'cases' | 'consultations' | 'users' | 'reviews' | null;

export function AdminStatsWidgets() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWidget, setActiveWidget] = useState<WidgetType>(null);

  const fetchStats = async () => {
    try {
      const [
        { data: firms },
        { data: cases },
        { data: consultations },
        { data: profiles },
        { data: reviews },
      ] = await Promise.all([
        supabase.from('law_firms').select('is_verified, nda_signed'),
        supabase.from('cases').select('status'),
        supabase.from('consultations').select('status'),
        supabase.from('profiles').select('user_type'),
        supabase.from('reviews').select('rating'),
      ]);

      const f = firms || [];
      const c = cases || [];
      const con = consultations || [];
      const p = profiles || [];
      const r = reviews || [];

      setStats({
        totalFirms: f.length,
        verifiedFirms: f.filter(x => x.is_verified).length,
        pendingFirms: f.filter(x => x.nda_signed && !x.is_verified).length,
        unverifiedFirms: f.filter(x => !x.nda_signed).length,
        totalCases: c.length,
        pendingCases: c.filter(x => x.status === 'pending').length,
        matchedCases: c.filter(x => x.status === 'matched').length,
        completedCases: c.filter(x => x.status === 'completed').length,
        totalConsultations: con.length,
        scheduledConsultations: con.filter(x => x.status === 'scheduled').length,
        completedConsultations: con.filter(x => x.status === 'completed').length,
        cancelledConsultations: con.filter(x => x.status === 'cancelled').length,
        totalUsers: p.length,
        individualUsers: p.filter(x => x.user_type === 'individual').length,
        firmUsers: p.filter(x => x.user_type === 'firm').length,
        totalReviews: r.length,
        averageRating: r.length > 0 ? Math.round((r.reduce((s, x) => s + x.rating, 0) / r.length) * 10) / 10 : 0,
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Real-time subscriptions
    const channel = supabase
      .channel('admin-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'law_firms' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const widgets = [
    {
      key: 'firms' as WidgetType,
      icon: Building2,
      label: 'Total Firms',
      value: stats.totalFirms,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
      sub: `${stats.verifiedFirms} verified`,
    },
    {
      key: 'cases' as WidgetType,
      icon: Briefcase,
      label: 'Total Cases',
      value: stats.totalCases,
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-100',
      sub: `${stats.pendingCases} pending`,
    },
    {
      key: 'consultations' as WidgetType,
      icon: Calendar,
      label: 'Consultations',
      value: stats.totalConsultations,
      accent: 'text-green-600',
      bgAccent: 'bg-green-100',
      sub: `${stats.completedConsultations} completed`,
    },
    {
      key: 'users' as WidgetType,
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      accent: 'text-purple-600',
      bgAccent: 'bg-purple-100',
      sub: `${stats.individualUsers} individuals`,
    },
    {
      key: 'reviews' as WidgetType,
      icon: Star,
      label: 'Reviews',
      value: stats.totalReviews,
      accent: 'text-yellow-600',
      bgAccent: 'bg-yellow-100',
      sub: `${stats.averageRating} avg rating`,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {widgets.map(w => (
          <Card
            key={w.key}
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30"
            onClick={() => setActiveWidget(w.key)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${w.bgAccent}`}>
                  <w.icon className={`h-6 w-6 ${w.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold">{w.value}</p>
                  <p className="text-sm text-muted-foreground">{w.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firms Drill-down */}
      <Dialog open={activeWidget === 'firms'} onOpenChange={(o) => !o && setActiveWidget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Firms Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <BreakdownRow icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Verified" value={stats.verifiedFirms} total={stats.totalFirms} color="bg-green-500" />
            <BreakdownRow icon={<Clock className="h-4 w-4 text-amber-600" />} label="Pending Review" value={stats.pendingFirms} total={stats.totalFirms} color="bg-amber-500" />
            <BreakdownRow icon={<XCircle className="h-4 w-4 text-muted-foreground" />} label="NDA Not Signed" value={stats.unverifiedFirms} total={stats.totalFirms} color="bg-muted" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cases Drill-down */}
      <Dialog open={activeWidget === 'cases'} onOpenChange={(o) => !o && setActiveWidget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Cases Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <BreakdownRow icon={<Clock className="h-4 w-4 text-amber-600" />} label="Pending" value={stats.pendingCases} total={stats.totalCases} color="bg-amber-500" />
            <BreakdownRow icon={<TrendingUp className="h-4 w-4 text-blue-600" />} label="Matched" value={stats.matchedCases} total={stats.totalCases} color="bg-blue-500" />
            <BreakdownRow icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Completed" value={stats.completedCases} total={stats.totalCases} color="bg-green-500" />
            <BreakdownRow icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} label="Other" value={stats.totalCases - stats.pendingCases - stats.matchedCases - stats.completedCases} total={stats.totalCases} color="bg-muted" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Consultations Drill-down */}
      <Dialog open={activeWidget === 'consultations'} onOpenChange={(o) => !o && setActiveWidget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Consultations Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <BreakdownRow icon={<Clock className="h-4 w-4 text-blue-600" />} label="Scheduled" value={stats.scheduledConsultations} total={stats.totalConsultations} color="bg-blue-500" />
            <BreakdownRow icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Completed" value={stats.completedConsultations} total={stats.totalConsultations} color="bg-green-500" />
            <BreakdownRow icon={<XCircle className="h-4 w-4 text-red-600" />} label="Cancelled" value={stats.cancelledConsultations} total={stats.totalConsultations} color="bg-red-500" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Drill-down */}
      <Dialog open={activeWidget === 'users'} onOpenChange={(o) => !o && setActiveWidget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Users Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <BreakdownRow icon={<Users className="h-4 w-4 text-purple-600" />} label="Individuals" value={stats.individualUsers} total={stats.totalUsers} color="bg-purple-500" />
            <BreakdownRow icon={<Building2 className="h-4 w-4 text-primary" />} label="Firm Users" value={stats.firmUsers} total={stats.totalUsers} color="bg-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviews Drill-down */}
      <Dialog open={activeWidget === 'reviews'} onOpenChange={(o) => !o && setActiveWidget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" /> Reviews Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{stats.averageRating}</p>
              <div className="flex justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-5 w-5 ${s <= Math.round(stats.averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Based on {stats.totalReviews} reviews</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BreakdownRow({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{value}</span>
          <Badge variant="outline" className="text-xs">{pct}%</Badge>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
