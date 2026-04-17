import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, Calendar, MessageSquare, ExternalLink, Award, Star, Banknote, Globe } from "lucide-react";

interface AwardItem {
  title: string;
  organization: string;
  year: string;
  type: 'win' | 'nomination';
}

interface FirmInterest {
  id: string;
  firm_id: string;
  case_id: string;
  status: string;
  message: string | null;
  created_at: string;
  consultation_fee_quoted?: number | null;
  law_firm: {
    id: string;
    firm_name: string;
    practice_areas: string[];
    city: string | null;
    country: string | null;
    is_verified: boolean;
    consultation_fee?: number | null;
    trustpilot_url?: string | null;
    google_reviews_url?: string | null;
    awards?: AwardItem[] | null;
    website?: string | null;
  };
}

interface FirmInterestCardProps {
  interest: FirmInterest;
  caseName: string;
  onAccept: (matchId: string, firmId: string) => void;
  onReject: (matchId: string) => void;
  onSchedule: (matchId: string, firmId: string) => void;
  isLoading?: boolean;
  compact?: boolean;
  hideActions?: boolean;
}

const formatFee = (fee?: number | null) => {
  if (fee == null) return null;
  return `£${Number(fee).toFixed(0)}`;
};

export function FirmInterestCard({
  interest,
  caseName,
  onAccept,
  onReject,
  onSchedule,
  isLoading,
  compact = false,
  hideActions = false
}: FirmInterestCardProps) {
  const navigate = useNavigate();

  const viewFirmProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/firm/${interest.law_firm.id}`);
  };

  const fee = interest.consultation_fee_quoted ?? interest.law_firm.consultation_fee;
  const awards = interest.law_firm.awards || [];
  const wins = awards.filter(a => a.type === 'win').length;
  const noms = awards.filter(a => a.type === 'nomination').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Interested</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-card border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
            <button
              onClick={viewFirmProfile}
              className="font-medium text-sm hover:text-primary hover:underline truncate"
            >
              {interest.law_firm.firm_name}
            </button>
            {interest.law_firm.is_verified && (
              <Badge variant="secondary" className="text-xs">✓</Badge>
            )}
          </div>
          {getStatusBadge(interest.status)}
        </div>

        {interest.law_firm.city && (
          <p className="text-xs text-muted-foreground">
            {interest.law_firm.city}{interest.law_firm.country ? `, ${interest.law_firm.country}` : ''}
          </p>
        )}

        {fee != null && (
          <div className="flex items-center gap-1 text-sm">
            <Banknote className="h-3 w-3 text-primary" />
            <span className="font-semibold">{formatFee(fee)}</span>
            <span className="text-xs text-muted-foreground">/ 30 min consultation</span>
          </div>
        )}

        {(wins > 0 || noms > 0) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            {wins > 0 && <span>{wins} win{wins !== 1 ? 's' : ''}</span>}
            {wins > 0 && noms > 0 && <span>·</span>}
            {noms > 0 && <span>{noms} nomination{noms !== 1 ? 's' : ''}</span>}
          </div>
        )}

        {interest.message && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            "{interest.message}"
          </p>
        )}

        <div className="flex gap-1 flex-wrap">
          {interest.law_firm.trustpilot_url && (
            <a href={interest.law_firm.trustpilot_url} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="text-xs flex items-center gap-1 text-primary hover:underline">
              <Star className="h-3 w-3" /> Trustpilot
            </a>
          )}
          {interest.law_firm.google_reviews_url && (
            <a href={interest.law_firm.google_reviews_url} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="text-xs flex items-center gap-1 text-primary hover:underline ml-2">
              <Star className="h-3 w-3" /> Google
            </a>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={viewFirmProfile}
          className="w-full text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Compare Profile
        </Button>

        {!hideActions && interest.status === 'interested' && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onSchedule(interest.id, interest.firm_id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Book
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(interest.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {!hideActions && interest.status === 'accepted' && (
          <Button
            size="sm"
            onClick={() => onSchedule(interest.id, interest.firm_id)}
            className="w-full"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Video Consultation
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
            <button onClick={viewFirmProfile} className="hover:text-primary hover:underline text-left">
              <CardTitle className="text-lg">{interest.law_firm.firm_name}</CardTitle>
            </button>
            {interest.law_firm.is_verified && (
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            )}
          </div>
          {getStatusBadge(interest.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Interested in: <span className="font-medium text-foreground">{caseName}</span></p>
          {interest.law_firm.city && (
            <p>Location: {interest.law_firm.city}{interest.law_firm.country ? `, ${interest.law_firm.country}` : ''}</p>
          )}
        </div>

        {/* Pricing & reputation summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fee != null && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Banknote className="h-3 w-3" /> Consultation fee
              </div>
              <div className="text-xl font-bold text-foreground">{formatFee(fee)}</div>
              <div className="text-xs text-muted-foreground">per 30-min video session</div>
            </div>
          )}
          {(wins > 0 || noms > 0) && (
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Award className="h-3 w-3" /> Recognition
              </div>
              <div className="text-sm font-semibold text-foreground">
                {wins > 0 && `${wins} award${wins !== 1 ? 's' : ''}`}
                {wins > 0 && noms > 0 && ' · '}
                {noms > 0 && `${noms} nomination${noms !== 1 ? 's' : ''}`}
              </div>
            </div>
          )}
        </div>

        {/* Awards list */}
        {awards.length > 0 && (
          <div className="space-y-1">
            {awards.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Award className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="font-medium">{a.title}</span>
                <span className="text-muted-foreground">— {a.organization}{a.year ? ` (${a.year})` : ''}</span>
                <Badge variant={a.type === 'win' ? 'default' : 'outline'} className="text-[10px] py-0">
                  {a.type === 'win' ? 'Win' : 'Nominee'}
                </Badge>
              </div>
            ))}
            {awards.length > 3 && (
              <p className="text-xs text-muted-foreground">+{awards.length - 3} more</p>
            )}
          </div>
        )}

        {/* External links */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          {interest.law_firm.website && (
            <a href={interest.law_firm.website} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="flex items-center gap-1 text-primary hover:underline">
              <Globe className="h-3 w-3" /> Website
            </a>
          )}
          {interest.law_firm.trustpilot_url && (
            <a href={interest.law_firm.trustpilot_url} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="flex items-center gap-1 text-primary hover:underline">
              <Star className="h-3 w-3" /> Trustpilot Reviews
            </a>
          )}
          {interest.law_firm.google_reviews_url && (
            <a href={interest.law_firm.google_reviews_url} target="_blank" rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="flex items-center gap-1 text-primary hover:underline">
              <Star className="h-3 w-3" /> Google Reviews
            </a>
          )}
        </div>

        {interest.law_firm.practice_areas?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interest.law_firm.practice_areas.slice(0, 4).map((area) => (
              <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
            ))}
            {interest.law_firm.practice_areas.length > 4 && (
              <Badge variant="outline" className="text-xs">+{interest.law_firm.practice_areas.length - 4}</Badge>
            )}
          </div>
        )}

        {interest.message && (
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <MessageSquare className="h-4 w-4" />
              Message from firm
            </div>
            <p className="text-sm text-muted-foreground">{interest.message}</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={viewFirmProfile}
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Firm Profile
        </Button>

        {!hideActions && interest.status === 'interested' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onSchedule(interest.id, interest.firm_id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Video Consultation
            </Button>
            <Button
              variant="outline"
              onClick={() => onReject(interest.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Not Interested
            </Button>
          </div>
        )}

        {!hideActions && interest.status === 'accepted' && (
          <Button
            onClick={() => onSchedule(interest.id, interest.firm_id)}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Video Consultation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
