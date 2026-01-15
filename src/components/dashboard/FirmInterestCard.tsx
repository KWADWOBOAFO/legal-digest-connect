import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, Calendar, MessageSquare, ExternalLink } from "lucide-react";

interface FirmInterest {
  id: string;
  firm_id: string;
  case_id: string;
  status: string;
  message: string | null;
  created_at: string;
  law_firm: {
    id: string;
    firm_name: string;
    practice_areas: string[];
    city: string | null;
    country: string | null;
    is_verified: boolean;
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-card border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <button 
              onClick={viewFirmProfile}
              className="font-medium text-sm hover:text-primary hover:underline"
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

        {interest.message && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            "{interest.message}"
          </p>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={viewFirmProfile}
          className="w-full text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Firm Profile
        </Button>

        {!hideActions && interest.status === 'interested' && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onAccept(interest.id, interest.firm_id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
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
            Schedule
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <button onClick={viewFirmProfile} className="hover:text-primary hover:underline">
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
        <div className="text-sm text-muted-foreground">
          <p>Interested in: <span className="font-medium text-foreground">{caseName}</span></p>
          {interest.law_firm.city && (
            <p>Location: {interest.law_firm.city}{interest.law_firm.country ? `, ${interest.law_firm.country}` : ''}</p>
          )}
          {interest.law_firm.practice_areas?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {interest.law_firm.practice_areas.slice(0, 3).map((area) => (
                <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
              ))}
              {interest.law_firm.practice_areas.length > 3 && (
                <Badge variant="outline" className="text-xs">+{interest.law_firm.practice_areas.length - 3}</Badge>
              )}
            </div>
          )}
        </div>

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
          View Firm Profile
        </Button>

        {!hideActions && interest.status === 'interested' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAccept(interest.id, interest.firm_id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => onReject(interest.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {!hideActions && interest.status === 'accepted' && (
          <Button
            onClick={() => onSchedule(interest.id, interest.firm_id)}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Consultation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
