import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FirmRating {
  firmId: string;
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    is_anonymous: boolean | null;
  }[];
}

export function useFirmRatings(firmIds: string[]) {
  const [ratings, setRatings] = useState<Record<string, FirmRating>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (firmIds.length === 0) return;
    
    const fetchRatings = async () => {
      setIsLoading(true);
      try {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('id, firm_id, rating, review_text, created_at, is_anonymous')
          .in('firm_id', firmIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const ratingsMap: Record<string, FirmRating> = {};

        firmIds.forEach(firmId => {
          const firmReviews = (reviews || []).filter(r => r.firm_id === firmId);
          const avgRating = firmReviews.length > 0
            ? firmReviews.reduce((sum, r) => sum + r.rating, 0) / firmReviews.length
            : 0;

          ratingsMap[firmId] = {
            firmId,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: firmReviews.length,
            recentReviews: firmReviews.slice(0, 3).map(r => ({
              id: r.id,
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              is_anonymous: r.is_anonymous
            }))
          };
        });

        setRatings(ratingsMap);
      } catch (error) {
        console.error('Error fetching firm ratings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [firmIds.join(',')]);

  return { ratings, isLoading };
}
