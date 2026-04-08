import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Briefcase,
  Calendar,
  Users,
  Star,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalFirms: number;
  verifiedFirms: number;
  totalCases: number;
  pendingCases: number;
  totalConsultations: number;
  completedConsultations: number;
  totalUsers: number;
  individualUsers: number;
  totalReviews: number;
  averageRating: number;
}

export function AdminStatsWidgets() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        totalCases: c.length,
        pendingCases: c.filter(x => x.status === 'pending').length,
        totalConsultations: con.length,
        completedConsultations: con.filter(x => x.status === 'completed').length,
        totalUsers: p.length,
        individualUsers: p.filter(x => x.user_type === 'individual').length,
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
          <Card key={i} className="animate-pulse"><CardContent className="pt-6 h-24" /></Card>
        ))}
      </div>
    );
  }

  const widgets = [
    { path: '/admin/firms', icon: Building2, label: 'Total Firms', value: stats.totalFirms, accent: 'text-primary', bgAccent: 'bg-primary/10', sub: `${stats.verifiedFirms} verified` },
    { path: '/admin/cases', icon: Briefcase, label: 'Total Cases', value: stats.totalCases, accent: 'text-blue-600', bgAccent: 'bg-blue-100', sub: `${stats.pendingCases} pending` },
    { path: '/admin/consultations', icon: Calendar, label: 'Consultations', value: stats.totalConsultations, accent: 'text-green-600', bgAccent: 'bg-green-100', sub: `${stats.completedConsultations} completed` },
    { path: '/admin/users', icon: Users, label: 'Total Users', value: stats.totalUsers, accent: 'text-purple-600', bgAccent: 'bg-purple-100', sub: `${stats.individualUsers} individuals` },
    { path: '/admin/reviews', icon: Star, label: 'Reviews', value: stats.totalReviews, accent: 'text-yellow-600', bgAccent: 'bg-yellow-100', sub: `${stats.averageRating} avg rating` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {widgets.map(w => (
        <Card
          key={w.path}
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30"
          onClick={() => navigate(w.path)}
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
  );
}
