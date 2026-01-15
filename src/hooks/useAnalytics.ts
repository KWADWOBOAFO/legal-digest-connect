import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  casesByStatus: { name: string; value: number }[];
  casesByMonth: { month: string; cases: number }[];
  consultationTrends: { month: string; scheduled: number; completed: number }[];
  engagementRate: number;
  totalCases: number;
  totalConsultations: number;
  activeMatches: number;
}

export function useAnalytics() {
  const { user, profile, lawFirm } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isClient = profile?.user_type === 'individual';

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, lawFirm]);

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

      let casesQuery = supabase.from('cases').select('status, created_at');
      let matchesQuery = supabase.from('case_matches').select('status');
      let consultationsQuery = supabase.from('consultations').select('status, scheduled_at, created_at');

      if (isClient) {
        casesQuery = casesQuery.eq('user_id', user!.id);
        consultationsQuery = consultationsQuery.eq('user_id', user!.id);
      } else if (lawFirm) {
        matchesQuery = matchesQuery.eq('firm_id', lawFirm.id);
        consultationsQuery = consultationsQuery.eq('firm_id', lawFirm.id);
      }

      const [casesResult, matchesResult, consultationsResult] = await Promise.all([
        casesQuery,
        matchesQuery,
        consultationsQuery
      ]);

      const cases = casesResult.data || [];
      const matches = matchesResult.data || [];
      const consultations = consultationsResult.data || [];

      // Cases by status
      const statusCounts = cases.reduce((acc: Record<string, number>, c) => {
        const status = c.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const casesByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Cases by month
      const casesByMonth = months.map(({ month, start, end }) => ({
        month,
        cases: cases.filter(c => c.created_at >= start && c.created_at <= end).length
      }));

      // Consultation trends
      const consultationTrends = months.map(({ month, start, end }) => {
        const monthConsultations = consultations.filter(
          c => c.scheduled_at >= start && c.scheduled_at <= end
        );
        return {
          month,
          scheduled: monthConsultations.filter(c => c.status === 'scheduled').length,
          completed: monthConsultations.filter(c => c.status === 'completed').length
        };
      });

      // Calculate engagement rate
      let engagementRate = 0;
      if (isClient) {
        const totalMatches = matches.length;
        const acceptedMatches = matches.filter(m => m.status === 'accepted').length;
        engagementRate = totalMatches > 0 ? Math.round((acceptedMatches / totalMatches) * 100) : 0;
      } else {
        const totalConsultations = consultations.length;
        const completedConsultations = consultations.filter(c => c.status === 'completed').length;
        engagementRate = totalConsultations > 0 
          ? Math.round((completedConsultations / totalConsultations) * 100) 
          : 0;
      }

      setData({
        casesByStatus,
        casesByMonth,
        consultationTrends,
        engagementRate,
        totalCases: cases.length,
        totalConsultations: consultations.length,
        activeMatches: matches.filter(m => m.status === 'interested' || m.status === 'accepted').length
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: fetchAnalytics };
}
