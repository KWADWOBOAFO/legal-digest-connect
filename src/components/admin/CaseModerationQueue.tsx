import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Search,
  Eye,
  Clock,
  Loader2,
  Tag
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
import { useAuth } from '@/contexts/AuthContext';

interface Case {
  id: string;
  title: string;
  description: string;
  facts: string | null;
  status: string;
  moderation_status: string | null;
  moderation_notes: string | null;
  ai_analysis: string | null;
  ai_suggested_practice_areas: string[];
  assigned_practice_area: string | null;
  urgency_level: string | null;
  created_at: string;
  user_id: string;
}

interface Profile {
  email: string;
  full_name: string | null;
}

const CaseModerationQueue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'flagged' | 'all'>('pending');
  
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;
      setCases(casesData || []);

      if (casesData && casesData.length > 0) {
        const userIds = [...new Set(casesData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        
        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profilesMap[p.user_id] = { email: p.email, full_name: p.full_name };
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error loading cases",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeWithAI = async (caseItem: Case) => {
    setIsAnalyzing(true);
    setSuggestedTags([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-case', {
        body: {
          title: caseItem.title,
          description: caseItem.description,
          facts: caseItem.facts
        }
      });

      if (error) throw error;

      const tags = data?.practice_areas || [];
      setSuggestedTags(tags);
      
      // Update case with AI suggestions
      await supabase
        .from('cases')
        .update({ 
          ai_suggested_practice_areas: tags,
          ai_analysis: data?.analysis || null
        })
        .eq('id', caseItem.id);

      setCases(prev => prev.map(c => 
        c.id === caseItem.id 
          ? { ...c, ai_suggested_practice_areas: tags, ai_analysis: data?.analysis }
          : c
      ));

      toast({
        title: "AI Analysis Complete",
        description: `Suggested ${tags.length} practice areas`
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const moderateCase = async (caseId: string, status: 'approved' | 'rejected' | 'flagged', notes?: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ 
          moderation_status: status,
          moderation_notes: notes || null,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id
        })
        .eq('id', caseId);

      if (error) throw error;

      setCases(prev => prev.map(c => 
        c.id === caseId 
          ? { ...c, moderation_status: status, moderation_notes: notes || null }
          : c
      ));

      toast({
        title: `Case ${status}`,
        description: status === 'approved' 
          ? "The case has been approved and is now visible to law firms"
          : status === 'rejected'
          ? "The case has been rejected"
          : "The case has been flagged for review"
      });

      setIsDetailOpen(false);
      setIsRejectOpen(false);
      setRejectReason('');
    } catch (error) {
      toast({
        title: "Moderation failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const applyTag = async (caseId: string, tag: string) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ assigned_practice_area: tag })
        .eq('id', caseId);

      if (error) throw error;

      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, assigned_practice_area: tag } : c
      ));

      toast({
        title: "Practice area assigned",
        description: `Case tagged as "${tag}"`
      });
    } catch (error) {
      toast({
        title: "Failed to apply tag",
        variant: "destructive"
      });
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && (c.moderation_status || 'pending') === filterStatus;
  });

  const stats = {
    pending: cases.filter(c => !c.moderation_status || c.moderation_status === 'pending').length,
    approved: cases.filter(c => c.moderation_status === 'approved').length,
    rejected: cases.filter(c => c.moderation_status === 'rejected').length,
    flagged: cases.filter(c => c.moderation_status === 'flagged').length
  };

  const getModerationBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'flagged':
        return <Badge variant="outline" className="border-amber-500 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>;
      default:
        return <Badge variant="outline" className="border-blue-500 text-blue-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading cases...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-blue-700">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xl font-bold">{stats.approved}</p>
                <p className="text-xs text-green-700">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-red-700">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xl font-bold">{stats.flagged}</p>
                <p className="text-xs text-amber-700">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
              <option value="all">All Cases</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No cases found</h3>
            <p className="text-muted-foreground">
              {filterStatus === 'pending' 
                ? 'No cases are pending moderation'
                : 'Try adjusting your search or filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className={
              (!caseItem.moderation_status || caseItem.moderation_status === 'pending')
                ? 'border-blue-200 bg-blue-50/50' 
                : caseItem.moderation_status === 'flagged'
                ? 'border-amber-200 bg-amber-50/50'
                : ''
            }>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      {caseItem.title}
                      {getModerationBadge(caseItem.moderation_status)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {profiles[caseItem.user_id]?.email || 'Unknown user'} • 
                      Submitted: {new Date(caseItem.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {caseItem.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {caseItem.assigned_practice_area && (
                    <Badge variant="default">
                      <Tag className="h-3 w-3 mr-1" />
                      {caseItem.assigned_practice_area}
                    </Badge>
                  )}
                  {caseItem.ai_suggested_practice_areas?.map((area, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => applyTag(caseItem.id, area)}
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-primary" />
                      {area}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCase(caseItem);
                      setSuggestedTags(caseItem.ai_suggested_practice_areas || []);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAnalyzing}
                    onClick={() => analyzeWithAI(caseItem)}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Analyze
                  </Button>
                  
                  {(!caseItem.moderation_status || caseItem.moderation_status === 'pending' || caseItem.moderation_status === 'flagged') && (
                    <>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => moderateCase(caseItem.id, 'approved')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setIsRejectOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      {caseItem.moderation_status !== 'flagged' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-amber-500 text-amber-700 hover:bg-amber-50"
                          onClick={() => moderateCase(caseItem.id, 'flagged')}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Flag
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Case Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCase?.title}</DialogTitle>
            <DialogDescription>
              Case details and moderation
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {getModerationBadge(selectedCase.moderation_status)}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{selectedCase.description}</p>
              </div>
              
              {selectedCase.facts && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Facts</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedCase.facts}</p>
                </div>
              )}
              
              {selectedCase.ai_analysis && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Analysis
                  </p>
                  <p className="text-sm">{selectedCase.ai_analysis}</p>
                </div>
              )}
              
              {suggestedTags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">AI Suggested Practice Areas (click to apply)</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant={selectedCase.assigned_practice_area === tag ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => applyTag(selectedCase.id, tag)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isAnalyzing}
              onClick={() => selectedCase && analyzeWithAI(selectedCase)}
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              AI Analyze
            </Button>
            {(!selectedCase?.moderation_status || selectedCase?.moderation_status === 'pending' || selectedCase?.moderation_status === 'flagged') && (
              <>
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => selectedCase && moderateCase(selectedCase.id, 'approved')}
                >
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsRejectOpen(true);
                  }}
                >
                  Reject
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
            <DialogTitle>Reject Case</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this case
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedCase && moderateCase(selectedCase.id, 'rejected', rejectReason)}
            >
              Reject Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseModerationQueue;
