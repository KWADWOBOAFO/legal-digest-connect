import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Scale, 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  Upload,
  ExternalLink,
  AlertCircle,
  Star,
  BadgeCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirmInterestCard } from '@/components/dashboard/FirmInterestCard';
import { ScheduleConsultationDialog } from '@/components/dashboard/ScheduleConsultationDialog';
import DocumentUpload from '@/components/case/DocumentUpload';

interface CaseDetails {
  id: string;
  title: string;
  description: string;
  facts: string | null;
  status: string;
  assigned_practice_area: string | null;
  ai_suggested_practice_areas: string[];
  ai_analysis: string | null;
  urgency_level: string | null;
  budget_range: string | null;
  preferred_consultation_type: string | null;
  documents_url: string[] | null;
  created_at: string;
  updated_at: string;
}

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
    description: string | null;
    website: string | null;
  };
}

interface Consultation {
  id: string;
  scheduled_at: string;
  status: string;
  meeting_url: string | null;
  duration_minutes: number | null;
  notes: string | null;
  law_firms: {
    firm_name: string;
  } | null;
}

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [firmInterests, setFirmInterests] = useState<FirmInterest[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  // Scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ 
    matchId: string; 
    firmId: string; 
    firmName: string; 
    caseName: string 
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchCaseData();
    }
  }, [id]);

  const fetchCaseData = async () => {
    if (!id) return;
    
    try {
      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (caseError) throw caseError;

      // Fetch firm interests
      const { data: matchesData } = await supabase
        .from('case_matches')
        .select(`
          id,
          firm_id,
          case_id,
          status,
          message,
          created_at,
          law_firms!inner(id, firm_name, practice_areas, city, country, is_verified, description, website)
        `)
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      // Fetch consultations
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*, law_firms(firm_name)')
        .eq('case_id', id)
        .order('scheduled_at', { ascending: true });

      setCaseDetails(caseData);
      setFirmInterests((matchesData || []).map((m: any) => ({
        ...m,
        law_firm: m.law_firms
      })));
      setConsultations(consultationsData || []);
    } catch (error) {
      console.error('Error fetching case data:', error);
      toast({
        title: "Error loading case",
        description: "Could not load case details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInterest = async (matchId: string, firmId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('case_matches')
        .update({ status: 'accepted' })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Interest accepted",
        description: "The firm can now view your case documents. You can schedule a consultation."
      });
      
      fetchCaseData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept interest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInterest = async (matchId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('case_matches')
        .update({ status: 'rejected' })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Interest declined",
        description: "The firm has been notified."
      });
      
      fetchCaseData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline interest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenScheduleDialog = (matchId: string, firmId: string) => {
    const interest = firmInterests.find(i => i.id === matchId);
    if (interest && caseDetails) {
      setSelectedMatch({
        matchId,
        firmId,
        firmName: interest.law_firm.firm_name,
        caseName: caseDetails.title
      });
      setScheduleDialogOpen(true);
    }
  };

  const handleScheduleConsultation = async (data: {
    date: Date;
    time: string;
    duration: number;
    notes: string;
    consultationType: string;
  }) => {
    if (!selectedMatch || !user || !caseDetails) return;
    
    setActionLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const scheduledAt = new Date(data.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Generate meeting URL
      const { generateMeetingUrl } = await import('@/lib/meetingUtils');
      const meetingUrl = generateMeetingUrl(caseDetails.id);

      const { error } = await supabase
        .from('consultations')
        .insert({
          case_id: caseDetails.id,
          user_id: user.id,
          firm_id: selectedMatch.firmId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: data.duration,
          notes: data.notes,
          status: 'scheduled',
          meeting_url: meetingUrl
        });

      if (error) throw error;

      // Update case status
      await supabase
        .from('cases')
        .update({ status: 'consultation_scheduled' })
        .eq('id', caseDetails.id);

      toast({
        title: "Consultation scheduled",
        description: `Your consultation with ${selectedMatch.firmName} has been scheduled.`
      });
      
      setScheduleDialogOpen(false);
      setSelectedMatch(null);
      fetchCaseData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'consultation_scheduled': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (level: string | null) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingInterests = firmInterests.filter(i => i.status === 'interested');
  const acceptedInterests = firmInterests.filter(i => i.status === 'accepted');
  const rejectedInterests = firmInterests.filter(i => i.status === 'rejected');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">The case you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{caseDetails.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={getStatusColor(caseDetails.status)}>
                  {caseDetails.status.replace('_', ' ')}
                </Badge>
                {caseDetails.urgency_level && (
                  <Badge className={getUrgencyColor(caseDetails.urgency_level)}>
                    {caseDetails.urgency_level} urgency
                  </Badge>
                )}
                {caseDetails.assigned_practice_area && (
                  <Badge variant="outline">
                    <Scale className="h-3 w-3 mr-1" />
                    {caseDetails.assigned_practice_area}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpload(!showUpload)}>
                <Upload className="h-4 w-4 mr-2" />
                {showUpload ? 'Hide Upload' : 'Upload Documents'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>
                Add supporting documents to your case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload userId={user?.id || ''} caseId={caseDetails.id} onUploadComplete={fetchCaseData} />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{caseDetails.description}</p>
                </div>
                
                {caseDetails.facts && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Key Facts</h4>
                    <p className="text-sm whitespace-pre-wrap">{caseDetails.facts}</p>
                  </div>
                )}

                {caseDetails.ai_analysis && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">AI Analysis</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{caseDetails.ai_analysis}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Submitted</h4>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(caseDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {caseDetails.budget_range && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Budget Range</h4>
                      <p className="text-sm">{caseDetails.budget_range}</p>
                    </div>
                  )}
                  {caseDetails.preferred_consultation_type && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Preferred Consultation</h4>
                      <p className="text-sm capitalize">{caseDetails.preferred_consultation_type}</p>
                    </div>
                  )}
                </div>

                {caseDetails.ai_suggested_practice_areas && caseDetails.ai_suggested_practice_areas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Suggested Practice Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {caseDetails.ai_suggested_practice_areas.map((area, index) => (
                        <Badge key={index} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {caseDetails.documents_url && caseDetails.documents_url.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Documents</h4>
                    <div className="space-y-2">
                      {caseDetails.documents_url.map((url, index) => (
                        <a 
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          Document {index + 1}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultations */}
            {consultations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Scheduled Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consultations.map((consultation) => (
                      <div key={consultation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{consultation.law_firms?.firm_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(consultation.scheduled_at).toLocaleString()} • {consultation.duration_minutes} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                            {consultation.status}
                          </Badge>
                          {consultation.meeting_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={consultation.meeting_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Firm Interests */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Firm Interest
                </CardTitle>
                <CardDescription>
                  {firmInterests.length} firm{firmInterests.length !== 1 ? 's' : ''} interested
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="pending" className="text-xs">
                      Pending ({pendingInterests.length})
                    </TabsTrigger>
                    <TabsTrigger value="accepted" className="text-xs">
                      Accepted ({acceptedInterests.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="text-xs">
                      Declined ({rejectedInterests.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="mt-4 space-y-3">
                    {pendingInterests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No pending interests
                      </p>
                    ) : (
                      pendingInterests.map((interest) => (
                        <FirmInterestCard
                          key={interest.id}
                          interest={interest}
                          caseName={caseDetails.title}
                          onAccept={handleAcceptInterest}
                          onReject={handleRejectInterest}
                          onSchedule={handleOpenScheduleDialog}
                          isLoading={actionLoading}
                          compact
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="accepted" className="mt-4 space-y-3">
                    {acceptedInterests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No accepted interests yet
                      </p>
                    ) : (
                      acceptedInterests.map((interest) => (
                        <FirmInterestCard
                          key={interest.id}
                          interest={interest}
                          caseName={caseDetails.title}
                          onAccept={handleAcceptInterest}
                          onReject={handleRejectInterest}
                          onSchedule={handleOpenScheduleDialog}
                          isLoading={actionLoading}
                          compact
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="rejected" className="mt-4 space-y-3">
                    {rejectedInterests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No declined interests
                      </p>
                    ) : (
                      rejectedInterests.map((interest) => (
                        <div key={interest.id} className="p-3 bg-muted/30 rounded-lg opacity-60">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium text-sm">{interest.law_firm.firm_name}</span>
                          </div>
                          {interest.law_firm.city && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {interest.law_firm.city}, {interest.law_firm.country}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Case Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Interest</span>
                  <span className="font-medium">{firmInterests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Review</span>
                  <span className="font-medium text-yellow-600">{pendingInterests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Accepted</span>
                  <span className="font-medium text-green-600">{acceptedInterests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Consultations</span>
                  <span className="font-medium text-blue-600">{consultations.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Schedule Dialog */}
      {selectedMatch && (
        <ScheduleConsultationDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          firmName={selectedMatch.firmName}
          caseName={selectedMatch.caseName}
          onSchedule={handleScheduleConsultation}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default CaseDetail;
