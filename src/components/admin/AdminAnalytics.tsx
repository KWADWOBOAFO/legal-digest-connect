import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  Users, 
  Briefcase, 
  Building2, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface PlatformStats {
  totalUsers: number;
  totalFirms: number;
  totalCases: number;
  totalConsultations: number;
  completedConsultations: number;
  averageRating: number;
  pendingCases: number;
  verifiedFirms: number;
}

interface GrowthData {
  month: string;
  users: number;
  firms: number;
  cases: number;
}

interface CaseStatusData {
  name: string;
  value: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

const chartConfig = {
  users: { label: 'Users', color: 'hsl(var(--primary))' },
  firms: { label: 'Firms', color: 'hsl(var(--secondary))' },
  cases: { label: 'Cases', color: 'hsl(var(--accent))' },
  consultations: { label: 'Consultations', color: 'hsl(var(--primary))' },
};

export function AdminAnalytics() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [caseStatusData, setCaseStatusData] = useState<CaseStatusData[]>([]);
  const [consultationTrends, setConsultationTrends] = useState<{ month: string; scheduled: number; completed: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        return {
          month: format(date, 'MMM'),
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString()
        };
      });

      // Fetch all data in parallel
      const [
        { count: totalUsers },
        { count: totalFirms },
        { count: verifiedFirms },
        { data: casesData },
        { data: consultationsData },
        { data: reviewsData },
        { data: profilesData },
        { data: firmsTimeData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('law_firms').select('*', { count: 'exact', head: true }),
        supabase.from('law_firms').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('cases').select('status, created_at'),
        supabase.from('consultations').select('status, scheduled_at, created_at'),
        supabase.from('reviews').select('rating'),
        supabase.from('profiles').select('created_at'),
        supabase.from('law_firms').select('created_at')
      ]);

      const cases = casesData || [];
      const consultations = consultationsData || [];
      const reviews = reviewsData || [];
      const profiles = profilesData || [];
      const firms = firmsTimeData || [];

      // Calculate stats
      const completedConsultations = consultations.filter(c => c.status === 'completed').length;
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      const pendingCases = cases.filter(c => c.status === 'pending').length;

      setStats({
        totalUsers: totalUsers || 0,
        totalFirms: totalFirms || 0,
        totalCases: cases.length,
        totalConsultations: consultations.length,
        completedConsultations,
        averageRating: Math.round(averageRating * 10) / 10,
        pendingCases,
        verifiedFirms: verifiedFirms || 0
      });

      // Calculate case status distribution
      const statusCounts = cases.reduce((acc: Record<string, number>, c) => {
        const status = c.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setCaseStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
          value
        }))
      );

      // Calculate growth data
      const growth = months.map(({ month, start, end }) => ({
        month,
        users: profiles.filter(p => p.created_at >= start && p.created_at <= end).length,
        firms: firms.filter(f => f.created_at >= start && f.created_at <= end).length,
        cases: cases.filter(c => c.created_at >= start && c.created_at <= end).length
      }));
      setGrowthData(growth);

      // Calculate consultation trends
      const trends = months.map(({ month, start, end }) => {
        const monthConsultations = consultations.filter(
          c => c.scheduled_at >= start && c.scheduled_at <= end
        );
        return {
          month,
          scheduled: monthConsultations.filter(c => c.status === 'scheduled').length,
          completed: monthConsultations.filter(c => c.status === 'completed').length
        };
      });
      setConsultationTrends(trends);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading platform analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Building2 className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Law Firms</p>
                <p className="text-2xl font-bold">
                  {stats?.verifiedFirms}/{stats?.totalFirms}
                </p>
                <p className="text-xs text-muted-foreground">verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Briefcase className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{stats?.totalCases}</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingCases} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consultations</p>
                <p className="text-2xl font-bold">{stats?.totalConsultations}</p>
                <p className="text-xs text-muted-foreground">{stats?.completedConsultations} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.totalConsultations 
                    ? Math.round((stats.completedConsultations / stats.totalConsultations) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{stats?.averageRating || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Cases</p>
                <p className="text-2xl font-bold">{stats?.pendingCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.totalFirms 
                    ? Math.round((stats.verifiedFirms / stats.totalFirms) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={growthData}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="firms" 
                  stackId="2"
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">Firms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {caseStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {caseStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Volume Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Case Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <BarChart data={growthData}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Consultation Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consultation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <LineChart data={consultationTrends}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary))' }}
              />
            </LineChart>
          </ChartContainer>
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
