import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, Calendar, MessageSquare } from "lucide-react";

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
}

export function FirmInterestCard({
  interest,
  caseName,
  onAccept,
  onReject,
  onSchedule,
  isLoading
}: FirmInterestCardProps) {
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

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{interest.law_firm.firm_name}</CardTitle>
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

        {interest.status === 'interested' && (
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

        {interest.status === 'accepted' && (
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
