import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const IndividualDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: casesData } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*, law_firms(firm_name)')
        .order('scheduled_at', { ascending: true });

      setCases(casesData || []);
      setConsultations(consultationsData || []);
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
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || 'User'}
            </span>
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
          <TabsList>
            <TabsTrigger value="cases">My Cases</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="matches">Firm Matches</TabsTrigger>
          </TabsList>

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
                <Card key={caseItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
                  <h3 className="text-lg font-semibold mb-2">No consultations scheduled</h3>
                  <p className="text-muted-foreground">
                    Once a law firm matches with your case, you'll be able to schedule a consultation
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

          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Firm matches will appear here</h3>
                <p className="text-muted-foreground">
                  When law firms express interest in your case, you'll see them here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default IndividualDashboard;
