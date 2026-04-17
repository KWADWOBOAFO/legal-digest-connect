import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  MapPin, 
  Star, 
  BadgeCheck, 
  Scale,
  ExternalLink,
  Calendar,
  Banknote,
  Award,
  Globe
} from 'lucide-react';
import { calculateDistance, formatDistance, RADIUS_OPTIONS, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/locationUtils';
import { ScheduleConsultationDialog } from '@/components/dashboard/ScheduleConsultationDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFirmRatings } from '@/hooks/useFirmRatings';
import { FirmRatingDisplay } from '@/components/case/FirmRatingDisplay';

interface AwardItem {
  title: string;
  organization: string;
  year: string;
  type: 'win' | 'nomination';
}

interface LawFirm {
  id: string;
  firm_name: string;
  description: string | null;
  practice_areas: string[] | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean | null;
  website: string | null;
  consultation_fee?: number | null;
  trustpilot_url?: string | null;
  google_reviews_url?: string | null;
  awards?: AwardItem[] | null;
  distance?: number;
}

interface MatchedFirmsListProps {
  caseId: string;
  casePracticeArea: string | null;
  caseName: string;
  userLatitude?: number | null;
  userLongitude?: number | null;
  onFirmSelected?: (firmId: string) => void;
}

export function MatchedFirmsList({ 
  caseId, 
  casePracticeArea, 
  caseName,
  userLatitude, 
  userLongitude,
  onFirmSelected 
}: MatchedFirmsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firms, setFirms] = useState<LawFirm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_SEARCH_RADIUS_KM);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<LawFirm | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // Fetch ratings for all displayed firms
  const firmIds = useMemo(() => firms.map(f => f.id), [firms]);
  const { ratings } = useFirmRatings(firmIds);

  useEffect(() => {
    fetchMatchingFirms();
  }, [casePracticeArea, searchRadius, userLatitude, userLongitude]);

  const fetchMatchingFirms = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('law_firms')
        .select('*')
        .eq('is_verified', true)
        .eq('nda_signed', true);

      // Filter by practice area if available
      if (casePracticeArea) {
        query = query.contains('practice_areas', [casePracticeArea]);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredFirms = (data || []) as unknown as LawFirm[];

      // Calculate distances and filter by radius
      if (userLatitude && userLongitude && searchRadius > 0) {
        filteredFirms = filteredFirms
          .map(firm => {
            if (firm.latitude && firm.longitude) {
              const distance = calculateDistance(
                userLatitude,
                userLongitude,
                firm.latitude,
                firm.longitude
              );
              return { ...firm, distance };
            }
            return { ...firm, distance: undefined };
          })
          .filter(firm => firm.distance !== undefined && firm.distance <= searchRadius)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        // Nationwide search - sort alphabetically
        filteredFirms = filteredFirms.sort((a, b) => 
          a.firm_name.localeCompare(b.firm_name)
        );
      }

      setFirms(filteredFirms);
    } catch (error) {
      console.error('Error fetching firms:', error);
      toast({
        title: "Error loading firms",
        description: "Could not load matching law firms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleConsultation = (firm: LawFirm) => {
    setSelectedFirm(firm);
    setScheduleDialogOpen(true);
  };

  const handleConfirmSchedule = async (data: {
    date: Date;
    time: string;
    duration: number;
    notes: string;
    consultationType: string;
  }) => {
    if (!selectedFirm || !user) return;
    
    setIsScheduling(true);
    try {
      // First, create the case match if it doesn't exist
      const { data: existingMatch } = await supabase
        .from('case_matches')
        .select('id')
        .eq('case_id', caseId)
        .eq('firm_id', selectedFirm.id)
        .maybeSingle();

      let matchId = existingMatch?.id;

      if (!matchId) {
        const { data: newMatch, error: matchError } = await supabase
          .from('case_matches')
          .insert({
            case_id: caseId,
            firm_id: selectedFirm.id,
            status: 'accepted'
          })
          .select('id')
          .single();

        if (matchError) throw matchError;
        matchId = newMatch.id;
      }

      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const scheduledAt = new Date(data.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Generate meeting URL
      const { generateMeetingUrl } = await import('@/lib/meetingUtils');
      const meetingUrl = generateMeetingUrl(caseId);

      // Create consultation
      const { error: consultError } = await supabase
        .from('consultations')
        .insert({
          case_id: caseId,
          user_id: user.id,
          firm_id: selectedFirm.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: data.duration,
          notes: data.notes,
          status: 'scheduled',
          meeting_url: meetingUrl
        });

      if (consultError) throw consultError;

      // Update case status
      await supabase
        .from('cases')
        .update({ status: 'consultation_scheduled' })
        .eq('id', caseId);

      toast({
        title: "Consultation scheduled!",
        description: `Your 30-minute consultation with ${selectedFirm.firm_name} has been booked.`
      });
      
      setScheduleDialogOpen(false);
      setSelectedFirm(null);
      onFirmSelected?.(selectedFirm.id);
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      toast({
        title: "Error",
        description: "Failed to schedule consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Matched Law Firms</h3>
          <p className="text-sm text-muted-foreground">
            {firms.length} firm{firms.length !== 1 ? 's' : ''} matching your case
          </p>
        </div>
        
        {userLatitude && userLongitude && (
          <div className="flex items-center gap-2">
            <Label htmlFor="radius" className="text-sm whitespace-nowrap">Search radius:</Label>
            <Select
              value={searchRadius.toString()}
              onValueChange={(v) => setSearchRadius(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {firms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No matching firms found</h3>
            <p className="text-muted-foreground mb-4">
              {searchRadius > 0 
                ? "Try expanding your search radius or selecting 'Nationwide'"
                : "No verified firms match your case criteria at this time."
              }
            </p>
            {searchRadius > 0 && userLatitude && userLongitude && (
              <Button variant="outline" onClick={() => setSearchRadius(-1)}>
                Search Nationwide
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {firms.map((firm) => (
            <Card key={firm.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{firm.firm_name}</h4>
                      {firm.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {firm.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {firm.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                      {(firm.city || firm.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[firm.city, firm.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {firm.distance !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDistance(firm.distance)} away
                        </Badge>
                      )}
                    </div>
                    
                    {/* Firm Rating Display */}
                    <div className="mb-3">
                      {ratings[firm.id] ? (
                        <FirmRatingDisplay
                          averageRating={ratings[firm.id].averageRating}
                          totalReviews={ratings[firm.id].totalReviews}
                          recentReviews={ratings[firm.id].recentReviews}
                        />
                      ) : (
                        <FirmRatingDisplay
                          averageRating={0}
                          totalReviews={0}
                        />
                      )}
                    </div>
                    
                    {firm.practice_areas && firm.practice_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {firm.practice_areas.slice(0, 4).map((area, idx) => (
                          <Badge 
                            key={idx} 
                            variant={area === casePracticeArea ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            <Scale className="h-2 w-2 mr-1" />
                            {area}
                          </Badge>
                        ))}
                        {firm.practice_areas.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{firm.practice_areas.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Awards */}
                    {firm.awards && firm.awards.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                        <Award className="h-3 w-3 text-primary" />
                        <span>
                          {firm.awards.filter(a => a.type === 'win').length} award{firm.awards.filter(a => a.type === 'win').length !== 1 ? 's' : ''}
                          {firm.awards.filter(a => a.type === 'nomination').length > 0 && ` · ${firm.awards.filter(a => a.type === 'nomination').length} nomination${firm.awards.filter(a => a.type === 'nomination').length !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                    {/* External review links */}
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      {firm.trustpilot_url && (
                        <a href={firm.trustpilot_url} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-primary hover:underline">
                          <Star className="h-3 w-3" /> Trustpilot
                        </a>
                      )}
                      {firm.google_reviews_url && (
                        <a href={firm.google_reviews_url} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-primary hover:underline">
                          <Star className="h-3 w-3" /> Google Reviews
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:items-end sm:min-w-[180px]">
                    {/* Consultation Fee */}
                    {firm.consultation_fee != null && (
                      <div className="text-right p-2 rounded-lg bg-primary/5 border border-primary/20 w-full sm:w-auto">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Banknote className="h-3 w-3" /> Consultation
                        </div>
                        <div className="text-lg font-bold text-foreground">£{Number(firm.consultation_fee).toFixed(0)}</div>
                        <div className="text-[10px] text-muted-foreground">30-min video session</div>
                      </div>
                    )}
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={() => handleScheduleConsultation(firm)}
                      className="w-full sm:w-auto"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Video Consultation
                    </Button>
                    {firm.website && (
                      <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                        <a href={firm.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Consultation Dialog */}
      {selectedFirm && (
        <ScheduleConsultationDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          firmName={selectedFirm.firm_name}
          caseName={caseName}
          onSchedule={handleConfirmSchedule}
          isLoading={isScheduling}
        />
      )}
    </div>
  );
}
