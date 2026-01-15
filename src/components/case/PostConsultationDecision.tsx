import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  RefreshCw, 
  Building2,
  Star,
  ThumbsUp,
  Search,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PostConsultationDecisionProps {
  consultationId: string;
  caseId: string;
  firmId: string;
  firmName: string;
  onDecisionMade?: () => void;
}

export function PostConsultationDecision({
  consultationId,
  caseId,
  firmId,
  firmName,
  onDecisionMade
}: PostConsultationDecisionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [decision, setDecision] = useState<'accept' | 'extend' | null>(null);
  const [notes, setNotes] = useState('');

  const handleAcceptFirm = async () => {
    setIsLoading(true);
    try {
      // Update case match status
      await supabase
        .from('case_matches')
        .update({ status: 'accepted' })
        .eq('case_id', caseId)
        .eq('firm_id', firmId);

      // Update case status to accepted
      await supabase
        .from('cases')
        .update({ status: 'accepted' })
        .eq('id', caseId);

      toast({
        title: "Firm accepted!",
        description: `You've chosen to work with ${firmName}. They will be notified.`
      });

      onDecisionMade?.();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting firm:', error);
      toast({
        title: "Error",
        description: "Failed to process your decision. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendSearch = async () => {
    setIsLoading(true);
    try {
      // Reset case status to pending to allow other firms to see it
      await supabase
        .from('cases')
        .update({ status: 'pending' })
        .eq('id', caseId);

      // Update the current match to reflect the decision
      await supabase
        .from('case_matches')
        .update({ 
          status: 'rejected',
          message: notes || 'Client chose to explore other options'
        })
        .eq('case_id', caseId)
        .eq('firm_id', firmId);

      toast({
        title: "Search extended",
        description: "Your case is now open for other law firms to view."
      });

      onDecisionMade?.();
      navigate(`/case/${caseId}`);
    } catch (error) {
      console.error('Error extending search:', error);
      toast({
        title: "Error",
        description: "Failed to process your decision. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          What would you like to do next?
        </CardTitle>
        <CardDescription>
          Your consultation with {firmName} is complete. Choose how to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Accept Firm Option */}
          <Card 
            className={`cursor-pointer transition-all hover:border-green-500 ${
              decision === 'accept' ? 'border-green-500 bg-green-50' : ''
            }`}
            onClick={() => setDecision('accept')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  decision === 'accept' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  <ThumbsUp className="h-6 w-6" />
                </div>
                <h4 className="font-semibold">Work with {firmName}</h4>
                <p className="text-sm text-muted-foreground">
                  Accept this firm to handle your case. They'll be notified and can start working with you.
                </p>
                <Badge variant="secondary" className="mt-2">
                  <Building2 className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Extend Search Option */}
          <Card 
            className={`cursor-pointer transition-all hover:border-blue-500 ${
              decision === 'extend' ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setDecision('extend')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  decision === 'extend' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="font-semibold">Explore Other Options</h4>
                <p className="text-sm text-muted-foreground">
                  Reopen your case to receive interest from other qualified law firms.
                </p>
                <Badge variant="outline" className="mt-2">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Keep Looking
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {decision === 'extend' && (
          <div className="space-y-2">
            <Label htmlFor="notes">
              Reason for exploring other options (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="This helps us improve our matching..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {decision && (
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDecision(null)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant={decision === 'accept' ? 'gold' : 'default'}
              onClick={decision === 'accept' ? handleAcceptFirm : handleExtendSearch}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : decision === 'accept' ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {decision === 'accept' ? 'Confirm Selection' : 'Extend Search'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
