import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, Clock, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CaseCardProps {
  caseData: {
    id: string;
    title: string;
    description: string;
    status: string;
    assigned_practice_area: string | null;
    ai_suggested_practice_areas: string[];
    urgency_level: string;
    created_at: string;
    profiles?: {
      full_name: string | null;
      location: string | null;
    } | null;
  };
  onExpressInterest: (caseId: string) => void;
  isMatched: boolean;
}

const CaseCard = ({ caseData, onExpressInterest, isMatched }: CaseCardProps) => {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const practiceAreas = caseData.assigned_practice_area 
    ? [caseData.assigned_practice_area] 
    : caseData.ai_suggested_practice_areas || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{caseData.title}</CardTitle>
            <CardDescription className="mt-2">
              {caseData.description.substring(0, 200)}...
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getUrgencyColor(caseData.urgency_level)}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {caseData.urgency_level} priority
            </Badge>
            {isMatched && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Matched
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Practice Areas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {practiceAreas.map((area, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              <Scale className="h-3 w-3 mr-1" />
              {area}
            </Badge>
          ))}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {caseData.profiles?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {caseData.profiles.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(caseData.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isMatched ? (
            <Button 
              variant="gold" 
              size="sm"
              onClick={() => onExpressInterest(caseData.id)}
            >
              Express Interest
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Already Matched
            </Button>
          )}
          <Button variant="outline" size="sm">
            View Full Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseCard;
