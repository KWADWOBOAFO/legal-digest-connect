import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  ArrowLeft, 
  Video, 
  Clock, 
  FileText,
  Save,
  Wand2,
  Loader2,
  CheckCircle2,
  Send,
  Star,
  VideoIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReviewDialog from '@/components/review/ReviewDialog';
import { VideoRoom } from '@/components/video/VideoRoom';

interface ConsultationData {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  ai_notes: string | null;
  meeting_url: string | null;
  user_id: string;
  firm_id: string;
  cases: {
    id: string;
    title: string;
    description: string;
    assigned_practice_area: string | null;
  } | null;
  law_firms?: {
    id: string;
    firm_name: string;
  } | null;
}

interface ClientProfile {
  full_name: string | null;
  email: string;
}

const Consultation = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showVideoRoom, setShowVideoRoom] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchConsultation();
    }
  }, [id, user, authLoading]);

  const fetchConsultation = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*, cases(id, title, description, assigned_practice_area), law_firms(id, firm_name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Consultation not found",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setConsultation(data);
      setNotes(data.notes || '');
      setAiNotes(data.ai_notes || '');

      // Fetch client profile separately
      if (data.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        if (profileData) {
          setClientProfile(profileData);
        }
      }

      // Check if user has already reviewed this consultation
      if (user?.id) {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('id')
          .eq('consultation_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasReviewed(!!reviewData);
      }
    } catch (error) {
      toast({
        title: "Error loading consultation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!consultation) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ notes, ai_notes: aiNotes })
        .eq('id', consultation.id);

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Your consultation notes have been saved."
      });
    } catch (error) {
      toast({
        title: "Error saving notes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAINotes = async () => {
    if (!consultation || !notes.trim()) {
      toast({
        title: "Please add notes first",
        description: "Enter your raw consultation notes to generate a formatted version.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get the user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please log in to use AI features.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-consultation-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            caseTitle: consultation.cases?.title || 'Case',
            caseDescription: consultation.cases?.description || '',
            practiceArea: consultation.cases?.assigned_practice_area,
            rawNotes: notes,
            clientName: clientProfile?.full_name || 'Client'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate notes');
      }

      const data = await response.json();
      setAiNotes(data.formattedNotes);

      toast({
        title: "Notes generated",
        description: "AI has formatted your consultation notes."
      });
    } catch (error) {
      toast({
        title: "Error generating notes",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!consultation) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          status: 'completed',
          notes,
          ai_notes: aiNotes
        })
        .eq('id', consultation.id);

      if (error) throw error;

      toast({
        title: "Consultation completed",
        description: "The client will be notified with the notes."
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error completing consultation",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!consultation) return null;

  const isScheduled = consultation.status === 'scheduled';
  const isCompleted = consultation.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Consultation Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{consultation.cases?.title || 'Consultation'}</h1>
              <p className="text-muted-foreground">
                Client: {clientProfile?.full_name || 'Anonymous'}
              </p>
            </div>
            <Badge className={isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {consultation.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(consultation.scheduled_at).toLocaleString()}
            </span>
            {consultation.cases?.assigned_practice_area && (
              <span className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                {consultation.cases.assigned_practice_area}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Case Details & Video */}
          <div className="space-y-6">
            {/* Video Section */}
            {isScheduled && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Consultation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showVideoRoom ? (
                    <VideoRoom 
                      roomId={consultation.id} 
                      onLeave={() => setShowVideoRoom(false)} 
                    />
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        variant="gold" 
                        className="w-full" 
                        onClick={() => setShowVideoRoom(true)}
                      >
                        <VideoIcon className="h-4 w-4 mr-2" />
                        Start Video Call
                      </Button>
                      {consultation.meeting_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={consultation.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join External Meeting
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{consultation.cases?.description || 'No description available'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notes */}
          <div className="space-y-6">
            {/* Raw Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Consultation Notes</CardTitle>
                <CardDescription>
                  Take notes during the consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your consultation notes here..."
                  rows={8}
                  disabled={isCompleted}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveNotes}
                    disabled={isSaving || isCompleted}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Notes
                  </Button>
                  <Button 
                    variant="gold" 
                    onClick={handleGenerateAINotes}
                    disabled={isGenerating || !notes.trim() || isCompleted}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Format with AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Formatted Notes */}
            {aiNotes && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    AI-Formatted Notes
                  </CardTitle>
                  <CardDescription>
                    Professional notes ready to send to the client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{aiNotes}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Complete Consultation */}
            {isScheduled && (
              <Button 
                variant="gold" 
                className="w-full"
                onClick={handleCompleteConsultation}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Complete Consultation & Send Notes
              </Button>
            )}

            {/* Review Button - Only for clients after consultation is completed */}
            {isCompleted && consultation.user_id === user?.id && !hasReviewed && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <h3 className="font-semibold mb-2">How was your experience?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Help others by sharing your feedback about {consultation.law_firms?.firm_name}
                    </p>
                    <Button onClick={() => setReviewDialogOpen(true)}>
                      <Star className="h-4 w-4 mr-2" />
                      Leave a Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasReviewed && (
              <div className="flex items-center gap-2 text-green-600 justify-center py-4">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Thanks for your review!</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      {consultation && consultation.law_firms && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          consultationId={consultation.id}
          firmId={consultation.firm_id}
          firmName={consultation.law_firms.firm_name}
          userId={user?.id || ''}
          onReviewSubmitted={() => setHasReviewed(true)}
        />
      )}
    </div>
  );
};

export default Consultation;
