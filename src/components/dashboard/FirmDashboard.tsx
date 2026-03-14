import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Scale, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Calendar,
  LogOut,
  Search,
  MapPin,
  Star,
  Users,
  Building2,
  Settings,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FirmOnboarding from './FirmOnboarding';
import CaseCard from './CaseCard';
import NotificationBell from '@/components/layout/NotificationBell';
import { AnalyticsSection } from './AnalyticsSection';
import { MessagingPanel } from '@/components/messaging/MessagingPanel';
import { SecureDocumentShare } from '@/components/documents/SecureDocumentShare';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationPermissionButton } from '@/components/notifications/NotificationPermissionButton';

interface Case {
  id: string;
  title: string;
  summary: string | null;
  description?: string;
  status: string;
  assigned_practice_area: string | null;
  ai_suggested_practice_areas: string[];
  urgency_level: string;
  created_at: string;
  location?: {
    full_name?: string | null;
    location?: string | null;
  };
}

interface CaseMatch {
  id: string;
  status: string;
  cases: {
    id: string;
    title: string;
    description: string;
    status: string;
    assigned_practice_area: string | null;
    ai_suggested_practice_areas: string[];
    urgency_level: string;
    created_at: string;
  };
}

interface Consultation {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  ai_notes: string | null;
  user_id: string;
  cases: {
    title: string;
  } | null;
}

interface ClientProfile {
  full_name: string | null;
}

const FirmDashboard = () => {
  const { profile, lawFirm, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [availableCases, setAvailableCases] = useState<Case[]>([]);
  const [matchedCases, setMatchedCases] = useState<CaseMatch[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceAreaFilter, setPracticeAreaFilter] = useState<string>('all');
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  
  // Enable push notifications
  usePushNotifications();

  useEffect(() => {
    if (lawFirm?.is_verified && lawFirm?.nda_signed) {
      fetchFirmData();
    } else {
      setIsLoading(false);
    }
  }, [lawFirm]);

  const fetchFirmData = async () => {
    try {
      // Fetch available cases (pending status) using anonymized view
      const { data: casesData } = await supabase
        .from('cases_pending_anonymized')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch firm's matched cases
      const { data: matchesData } = await supabase
        .from('case_matches')
        .select('*, cases(*)')
        .eq('firm_id', lawFirm?.id)
        .order('created_at', { ascending: false });

      // Fetch consultations
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*, cases(title)')
        .eq('firm_id', lawFirm?.id)
        .order('scheduled_at', { ascending: false });

      setAvailableCases(casesData || []);
      setMatchedCases(matchesData || []);
      setConsultations(consultationsData || []);

      // Fetch client profiles for consultations
      if (consultationsData && consultationsData.length > 0) {
        const userIds = [...new Set(consultationsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        if (profilesData) {
          const profiles: Record<string, ClientProfile> = {};
          profilesData.forEach(p => {
            profiles[p.user_id] = { full_name: p.full_name };
          });
          setClientProfiles(profiles);
        }
      }
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

  const handleExpressInterest = async (caseId: string) => {
    if (!lawFirm) return;

    try {
      const { error } = await supabase
        .from('case_matches')
        .insert({
          case_id: caseId,
          firm_id: lawFirm.id,
          status: 'interested'
        });

      if (error) throw error;

      toast({
        title: "Interest expressed",
        description: "The client will be notified of your interest."
      });

      fetchFirmData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not express interest. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredCases = availableCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPracticeArea = practiceAreaFilter === 'all' || 
      c.assigned_practice_area === practiceAreaFilter ||
      c.ai_suggested_practice_areas?.includes(practiceAreaFilter);
    return matchesSearch && matchesPracticeArea;
  });

  // Show onboarding if firm doesn't exist or hasn't signed NDA
  if (!lawFirm || !lawFirm.nda_signed) {
    return <FirmOnboarding lawFirm={lawFirm} onComplete={refreshProfile} />;
  }

  // Show pending verification state if NDA signed but not yet verified
  if (!lawFirm.is_verified) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">DEBRIEFED</span>
              <Badge variant="outline" className="ml-2">Law Firm</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Verification Pending</CardTitle>
              <CardDescription className="text-base">
                Thank you for signing the NDA, {lawFirm.firm_name}!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your firm is currently under review by our verification team. 
                This process typically takes 1-2 business days.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <h4 className="font-medium mb-2">What we're verifying:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Firm registration and credentials</li>
                  <li>• Professional licensing status</li>
                  <li>• Contact information accuracy</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll send you an email notification once your verification is complete.
                If you have any questions, please contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    toast({
                      title: "Checking status...",
                      description: "Refreshing your verification status."
                    });
                    await refreshProfile();
                  }}
                >
                  Check Status
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/firm-settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Firm Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
            <Badge variant="outline" className="ml-2">Law Firm</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || lawFirm.logo_url || undefined} alt={lawFirm.firm_name} />
                <AvatarFallback className="bg-accent/10 text-accent text-sm">
                  {lawFirm.firm_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {lawFirm.firm_name}
              </span>
            </div>
            <NotificationPermissionButton />
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile-settings')}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/firm-settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Firm Settings
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{availableCases.length}</p>
                  <p className="text-sm text-muted-foreground">Available Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{matchedCases.length}</p>
                  <p className="text-sm text-muted-foreground">Matched Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {consultations.filter(c => c.status === 'scheduled').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="browse">Browse Cases</TabsTrigger>
            <TabsTrigger value="matches">My Matches</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={practiceAreaFilter}
                    onChange={(e) => setPracticeAreaFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-background"
                  >
                    <option value="all">All Practice Areas</option>
                    {lawFirm.practice_areas?.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Cases List */}
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading cases...
                </CardContent>
              </Card>
            ) : filteredCases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No cases found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || practiceAreaFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'New cases will appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseData={caseItem}
                  onExpressInterest={handleExpressInterest}
                  isMatched={matchedCases.some(m => m.cases.id === caseItem.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {matchedCases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No matched cases yet</h3>
                  <p className="text-muted-foreground">
                    Express interest in cases to start matching with clients
                  </p>
                </CardContent>
              </Card>
            ) : (
              matchedCases.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{match.cases.title}</CardTitle>
                        <CardDescription>
                          {(match.cases.description || '').substring(0, 150)}...
                        </CardDescription>
                      </div>
                      <Badge>{match.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="gold" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Consultation
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="consultations" className="space-y-4">
            {consultations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No consultations yet</h3>
                  <p className="text-muted-foreground">
                    Schedule consultations with matched clients to see them here
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
                          {consultation.cases?.title || 'Consultation'}
                        </CardTitle>
                        <CardDescription>
                          Client: {clientProfiles[consultation.user_id]?.full_name || 'Anonymous'} • 
                          {new Date(consultation.scheduled_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge>{consultation.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {consultation.status === 'scheduled' && (
                        <Button variant="gold" size="sm" onClick={() => navigate(`/consultation/${consultation.id}`)}>
                          <Clock className="h-4 w-4 mr-2" />
                          Start Consultation
                        </Button>
                      )}
                      {consultation.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/consultation/${consultation.id}`)}>
                          View Notes
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
              <AnalyticsSection data={analyticsData} userType="firm" />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No analytics data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage your legal professionals and their specializations
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Team management features will be available soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FirmDashboard;
