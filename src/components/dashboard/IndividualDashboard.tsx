import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  Calendar,
  LogOut,
  Star,
  Building2,
  ExternalLink,
  BarChart3,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirmInterestCard } from './FirmInterestCard';
import { ScheduleConsultationDialog } from './ScheduleConsultationDialog';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { generateMeetingUrl } from '@/lib/meetingUtils';
import NotificationBell from '@/components/layout/NotificationBell';
import { AnalyticsSection } from './AnalyticsSection';
import { MessagingPanel } from '@/components/messaging/MessagingPanel';
import { SecureDocumentShare } from '@/components/documents/SecureDocumentShare';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationPermissionButton } from '@/components/notifications/NotificationPermissionButton';
import DraftCard from './DraftCard';
import { getDrafts } from '@/lib/draftUtils';

interface Case {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_practice_area: string | null;
  created_at: string;
}

interface Consultation {
  id: string;
  scheduled_at: string;
  status: string;
  meeting_url: string | null;
  law_firms: {
    firm_name: string;
  } | null;
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
  };
  case_title: string;
}

const IndividualDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [firmInterests, setFirmInterests] = useState<FirmInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  
  // Enable push notifications
  usePushNotifications();
  
  // Scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ matchId: string; firmId: string; firmName: string; caseName: string } | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Enable real-time notifications (callback will be called when new interest arrives)
  useRealtimeNotifications(user?.id, () => fetchUserData());

  const fetchUserData = async () => {
    try {
      // Fetch cases
      const { data: casesData } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch consultations
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*, law_firms(firm_name)')
        .order('scheduled_at', { ascending: true });

      // Fetch firm interests for user's cases
      const { data: matchesData } = await supabase
        .from('case_matches')
        .select(`
          id,
          firm_id,
          case_id,
          status,
          message,
          created_at,
          cases!inner(id, title, user_id),
          law_firms!inner(id, firm_name, practice_areas, city, country, is_verified)
        `)
        .order('created_at', { ascending: false });

      setCases(casesData || []);
      setConsultations(consultationsData || []);
      
      // Transform matches data
      const transformedInterests: FirmInterest[] = (matchesData || []).map((match: any) => ({
        id: match.id,
        firm_id: match.firm_id,
        case_id: match.case_id,
        status: match.status,
        message: match.message,
        created_at: match.created_at,
        law_firm: match.law_firms,
        case_title: match.cases.title
      }));
      setFirmInterests(transformedInterests);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
      
      fetchUserData();
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
      
      fetchUserData();
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
    if (interest) {
      setSelectedMatch({
        matchId,
        firmId,
        firmName: interest.law_firm.firm_name,
        caseName: interest.case_title
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
    if (!selectedMatch || !user) return;
    
    setActionLoading(true);
    try {
      // Find the case for this match
      const interest = firmInterests.find(i => i.id === selectedMatch.matchId);
      if (!interest) throw new Error("Match not found");

      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const scheduledAt = new Date(data.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Generate meeting URL
      const meetingUrl = generateMeetingUrl(interest.case_id);

      const { error } = await supabase
        .from('consultations')
        .insert({
          case_id: interest.case_id,
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
        .eq('id', interest.case_id);

      // Send email notification (fire and forget)
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'consultation_scheduled',
          recipientEmail: profile?.email,
          recipientName: profile?.full_name || 'User',
          data: {
            firmName: selectedMatch.firmName,
            caseTitle: interest.case_title,
            consultationDate: scheduledAt.toLocaleDateString(),
            consultationTime: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            meetingUrl
          }
        }
      }).catch(err => console.error('Failed to send email notification:', err));

      toast({
        title: "Consultation scheduled",
        description: `Your consultation with ${selectedMatch.firmName} has been scheduled.`
      });
      
      setScheduleDialogOpen(false);
      setSelectedMatch(null);
      fetchUserData();
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

  const pendingInterests = firmInterests.filter(i => i.status === 'interested');
  const acceptedInterests = firmInterests.filter(i => i.status === 'accepted');
  const draftCount = getDrafts().length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              Welcome, {profile?.full_name || 'User'}
            </span>
            <NotificationPermissionButton />
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile-settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{cases.length}</p>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {cases.filter(c => c.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingInterests.length}</p>
                  <p className="text-sm text-muted-foreground">Firm Interest</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {consultations.filter(c => c.status === 'scheduled').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Consultations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {cases.filter(c => c.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Dashboard</h1>
          <Button variant="gold" onClick={() => navigate('/submit-case')}>
            <Plus className="h-4 w-4 mr-2" />
            Submit New Case
          </Button>
        </div>

        <Tabs defaultValue="cases" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="cases">My Cases</TabsTrigger>
            <TabsTrigger value="drafts" className="relative">
              Drafts
              {draftCount > 0 && (
                <Badge className="ml-2 bg-accent text-accent-foreground text-xs px-1.5">
                  {draftCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="interests" className="relative">
              Firm Interest
              {pendingInterests.length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground text-xs px-1.5">
                  {pendingInterests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Drafts</CardTitle>
                <CardDescription>
                  Continue working on your unfinished case submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DraftCard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading your cases...
                </CardContent>
              </Card>
            ) : cases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Submit your first legal matter to get started
                  </p>
                  <Button variant="gold" onClick={() => navigate('/submit-case')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit a Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              cases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/case/${caseItem.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {caseItem.description.substring(0, 150)}...
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {caseItem.assigned_practice_area && (
                        <span className="flex items-center gap-1">
                          <Scale className="h-4 w-4" />
                          {caseItem.assigned_practice_area}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                      {firmInterests.filter(i => i.case_id === caseItem.id && i.status === 'interested').length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {firmInterests.filter(i => i.case_id === caseItem.id && i.status === 'interested').length} interested
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2 p-0 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/case/${caseItem.id}`);
                      }}
                    >
                      View Details <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            {firmInterests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No firm interest yet</h3>
                  <p className="text-muted-foreground">
                    When law firms express interest in your cases, you'll see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingInterests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      Pending Review ({pendingInterests.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingInterests.map((interest) => (
                        <FirmInterestCard
                          key={interest.id}
                          interest={interest}
                          caseName={interest.case_title}
                          onAccept={handleAcceptInterest}
                          onReject={handleRejectInterest}
                          onSchedule={handleOpenScheduleDialog}
                          isLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {acceptedInterests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Accepted ({acceptedInterests.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {acceptedInterests.map((interest) => (
                        <FirmInterestCard
                          key={interest.id}
                          interest={interest}
                          caseName={interest.case_title}
                          onAccept={handleAcceptInterest}
                          onReject={handleRejectInterest}
                          onSchedule={handleOpenScheduleDialog}
                          isLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {firmInterests.filter(i => i.status === 'rejected').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                      Declined ({firmInterests.filter(i => i.status === 'rejected').length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {firmInterests.filter(i => i.status === 'rejected').map((interest) => (
                        <FirmInterestCard
                          key={interest.id}
                          interest={interest}
                          caseName={interest.case_title}
                          onAccept={handleAcceptInterest}
                          onReject={handleRejectInterest}
                          onSchedule={handleOpenScheduleDialog}
                          isLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="consultations" className="space-y-4">
            {consultations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No consultations scheduled</h3>
                  <p className="text-muted-foreground">
                    Accept a firm's interest to schedule a consultation
                  </p>
                </CardContent>
              </Card>
            ) : (
              consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Consultation with {consultation.law_firms?.firm_name}
                        </CardTitle>
                        <CardDescription>
                          {new Date(consultation.scheduled_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {consultation.meeting_url && consultation.status === 'scheduled' && (
                        <Button variant="gold" size="sm" asChild>
                          <a href={consultation.meeting_url} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                      {consultation.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/review/${consultation.id}`)}>
                          <Star className="h-4 w-4 mr-2" />
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="messages">
            <MessagingPanel />
          </TabsContent>

          <TabsContent value="documents">
            <SecureDocumentShare />
          </TabsContent>

          <TabsContent value="analytics">
            {analyticsLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading analytics...
                </CardContent>
              </Card>
            ) : analyticsData ? (
              <AnalyticsSection data={analyticsData} userType="individual" />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No analytics data available
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Schedule Consultation Dialog */}
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

export default IndividualDashboard;
