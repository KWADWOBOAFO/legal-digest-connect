import { Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  is_anonymous: boolean | null;
}

interface FirmRatingDisplayProps {
  averageRating: number;
  totalReviews: number;
  recentReviews?: Review[];
  compact?: boolean;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export function FirmRatingDisplay({
  averageRating,
  totalReviews,
  recentReviews = [],
  compact = false
}: FirmRatingDisplayProps) {
  if (totalReviews === 0) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Star className="h-3 w-3" />
        No reviews yet
      </span>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs cursor-help">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              {averageRating.toFixed(1)} ({totalReviews})
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{totalReviews} client review{totalReviews !== 1 ? 's' : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 gap-2">
          <StarRating rating={averageRating} />
          <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Client Reviews</h4>
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="md" />
              <span className="font-bold">{averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          {recentReviews.length > 0 ? (
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        "{review.review_text}"
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {review.is_anonymous ? 'Anonymous' : 'Verified Client'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No written reviews yet
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
