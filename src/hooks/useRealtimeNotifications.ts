import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeNotifications = (onNewInterest?: () => void) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleNewInterest = useCallback(async (payload: any) => {
    const match = payload.new;
    
    // Only notify for new interest statuses
    if (match.status !== 'interested') return;

    // Fetch firm and case details for the notification
    try {
      const [firmResult, caseResult] = await Promise.all([
        supabase.from('law_firms').select('firm_name').eq('id', match.firm_id).single(),
        supabase.from('cases').select('title, user_id').eq('id', match.case_id).single()
      ]);

      // Only show notification if this is the case owner
      if (caseResult.data?.user_id !== user?.id) return;

      const firmName = firmResult.data?.firm_name || 'A law firm';
      const caseTitle = caseResult.data?.title || 'your case';

      toast({
        title: "🔔 New Firm Interest!",
        description: `${firmName} has expressed interest in "${caseTitle}"`,
        duration: 8000,
      });

      // Callback to refresh data
      onNewInterest?.();
    } catch (error) {
      console.error('Error fetching notification details:', error);
    }
  }, [toast, user?.id, onNewInterest]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('case-matches-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_matches'
        },
        (payload) => handleNewInterest(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleNewInterest]);
};
