import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Scale, 
  Shield, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search,
  LogOut,
  ExternalLink,
  Eye,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import CaseModerationQueue from '@/components/admin/CaseModerationQueue';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';

interface LawFirm {
  id: string;
  firm_name: string;
  description: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  practice_areas: string[];
  is_verified: boolean;
  nda_signed: boolean;
  nda_signed_at: string | null;
  created_at: string;
  user_id: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [firms, setFirms] = useState<LawFirm[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  
  // Dialog state
  const [selectedFirm, setSelectedFirm] = useState<LawFirm | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchFirms();
    }
  }, [isAdmin]);

  const fetchFirms = async () => {
    try {
      // Fetch all law firms
      const { data: firmsData, error: firmsError } = await supabase
        .from('law_firms')
        .select('*')
        .order('created_at', { ascending: false });

      if (firmsError) throw firmsError;
      setFirms(firmsData || []);

      // Fetch associated profiles
      if (firmsData && firmsData.length > 0) {
        const userIds = firmsData.map(f => f.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, phone')
          .in('user_id', userIds);
        
        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profilesMap[p.user_id] = p;
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error('Error fetching firms:', error);
      toast({
        title: "Error loading data",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyFirm = async (firmId: string) => {
    try {
      const { error } = await supabase
        .from('law_firms')
        .update({ is_verified: true })
        .eq('id', firmId);

      if (error) throw error;

      toast({
        title: "Firm verified",
        description: "The law firm has been successfully verified."
      });

      setFirms(firms.map(f => f.id === firmId ? { ...f, is_verified: true } : f));
      setIsDetailOpen(false);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectFirm = async () => {
    if (!selectedFirm) return;
    
    try {
      // For now, we just unverify them. In a full implementation,
      // you might want to store the rejection reason and notify the firm.
      const { error } = await supabase
        .from('law_firms')
        .update({ is_verified: false })
        .eq('id', selectedFirm.id);

      if (error) throw error;

      toast({
        title: "Firm rejected",
        description: "The verification has been denied."
      });

      setFirms(firms.map(f => f.id === selectedFirm.id ? { ...f, is_verified: false } : f));
      setIsRejectOpen(false);
      setRejectReason('');
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredFirms = firms.filter(firm => {
    const matchesSearch = 
      firm.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profiles[firm.user_id]?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && firm.nda_signed && !firm.is_verified;
    if (filterStatus === 'verified') return matchesSearch && firm.is_verified;
    return matchesSearch;
  });

  const stats = {
    total: firms.length,
    pending: firms.filter(f => f.nda_signed && !f.is_verified).length,
    verified: firms.filter(f => f.is_verified).length,
    unverified: firms.filter(f => !f.nda_signed).length
  };

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
            <Badge variant="destructive" className="ml-2">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Firms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-amber-700">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                  <p className="text-sm text-green-700">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.unverified}</p>
                  <p className="text-sm text-muted-foreground">Not Started</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
            <TabsTrigger value="firms">Law Firms</TabsTrigger>
            <TabsTrigger value="cases">Cases Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="firms" className="space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by firm name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border rounded-lg bg-background"
                  >
                    <option value="all">All Firms</option>
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Firms List */}
            {filteredFirms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No firms found</h3>
                  <p className="text-muted-foreground">
                    {filterStatus === 'pending' 
                      ? 'No firms are pending verification'
                      : 'Try adjusting your search or filter'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFirms.map((firm) => (
                  <Card key={firm.id} className={
                    firm.nda_signed && !firm.is_verified 
                      ? 'border-amber-200 bg-amber-50/50' 
                      : ''
                  }>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {firm.firm_name}
                            {firm.is_verified && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {firm.nda_signed && !firm.is_verified && (
                              <Badge variant="outline" className="border-amber-500 text-amber-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            )}
                            {!firm.nda_signed && (
                              <Badge variant="secondary">
                                NDA Not Signed
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {profiles[firm.user_id]?.email || 'No email'} • 
                            Registered: {new Date(firm.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {firm.practice_areas?.map((area, idx) => (
                          <Badge key={idx} variant="outline">{area}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedFirm(firm);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {firm.nda_signed && !firm.is_verified && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleVerifyFirm(firm.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setSelectedFirm(firm);
                                setIsRejectOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {firm.website && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={firm.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Website
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            <CaseModerationQueue />
          </TabsContent>
        </Tabs>
      </main>

      {/* Firm Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFirm?.firm_name}</DialogTitle>
            <DialogDescription>
              Review firm details and credentials
            </DialogDescription>
          </DialogHeader>
          
          {selectedFirm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{profiles[selectedFirm.user_id]?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{profiles[selectedFirm.user_id]?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profiles[selectedFirm.user_id]?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium">
                    {selectedFirm.website ? (
                      <a href={selectedFirm.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedFirm.website}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {[selectedFirm.address, selectedFirm.city, selectedFirm.country].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedFirm.description || 'No description provided'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Practice Areas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFirm.practice_areas?.map((area, idx) => (
                    <Badge key={idx} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">NDA Signed</p>
                  <p className="font-medium">
                    {selectedFirm.nda_signed ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Yes - {selectedFirm.nda_signed_at ? new Date(selectedFirm.nda_signed_at).toLocaleDateString() : 'Date unknown'}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        No
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <p className="font-medium">
                    {selectedFirm.is_verified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedFirm && selectedFirm.nda_signed && !selectedFirm.is_verified && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsRejectOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleVerifyFirm(selectedFirm.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Verification
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedFirm?.firm_name}'s verification request.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Reason for rejection (optional but recommended)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectFirm}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
