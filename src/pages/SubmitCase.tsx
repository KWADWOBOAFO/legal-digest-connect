import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Scale, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Brain, 
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import DocumentUpload from '@/components/case/DocumentUpload';

const caseSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title is too long'),
  description: z.string().min(50, 'Please provide more detail (at least 50 characters)').max(5000, 'Description is too long'),
  facts: z.string().max(10000, 'Facts section is too long').optional(),
});

interface IracAnalysis {
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
}

interface AIAnalysis {
  summary: string;
  iracAnalysis: IracAnalysis;
  primaryPracticeArea: string;
  secondaryPracticeAreas: string[];
  legalElements: string[];
  preparationQuestions: string[];
  urgencyAssessment: string;
  complexityLevel: string;
  estimatedTimeframe?: string;
}

const SubmitCase = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [facts, setFacts] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [consultationType, setConsultationType] = useState('video');
  const [budgetRange, setBudgetRange] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ name: string; path: string; size: number; type: string }>>([]);
  
  // AI Analysis
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const validateStep1 = () => {
    const result = caseSchema.safeParse({ title, description, facts });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAnalyze = async () => {
    if (!validateStep1()) return;
    
    setIsAnalyzing(true);
    try {
      // Get the user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please log in to analyze your case.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-case`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title, description, facts }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze case');
      }

      const data = await response.json();
      setAnalysis(data);
      setStep(2);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !analysis) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          title,
          description,
          facts,
          ai_analysis: analysis.summary,
          ai_suggested_practice_areas: [analysis.primaryPracticeArea, ...analysis.secondaryPracticeAreas],
          assigned_practice_area: analysis.primaryPracticeArea,
          urgency_level: analysis.urgencyAssessment || urgency,
          preferred_consultation_type: consultationType,
          budget_range: budgetRange,
          status: 'pending',
          documents_url: uploadedDocuments.map(d => d.path)
        });

      if (error) throw error;

      toast({
        title: "Case submitted successfully!",
        description: "Law firms matching your needs will be notified."
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 3</span>
            <span className="text-sm text-muted-foreground">
              {step === 1 && 'Describe Your Matter'}
              {step === 2 && 'Review AI Analysis'}
              {step === 3 && 'Confirm & Submit'}
            </span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Step 1: Describe Case */}
        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Describe Your Legal Matter
              </CardTitle>
              <CardDescription>
                Provide as much detail as possible so our AI can accurately analyze your case 
                and match you with the right legal professionals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title of Your Legal Matter *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Unfair dismissal from employment"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Describe Your Situation *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened, when it happened, and what outcome you're hoping for..."
                  rows={6}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {description.length}/5000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facts">Key Facts & Timeline (Optional)</Label>
                <Textarea
                  id="facts"
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  placeholder="List specific dates, names (anonymized if preferred), documents involved, etc."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Including specific facts helps our AI provide a more accurate analysis
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="low">Low - No immediate deadline</option>
                    <option value="normal">Normal - Within a few weeks</option>
                    <option value="high">High - Urgent matter</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Consultation</Label>
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In-Person Meeting</option>
                  </select>
                </div>
              </div>

              <Button 
                variant="gold" 
                className="w-full"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !title || !description}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Your Case...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Analysis */}
        {step === 2 && analysis && (
          <div className="space-y-6">
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Case Analysis
                </CardTitle>
                <CardDescription>
                  Our AI has analyzed your legal matter and identified the following
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <h4 className="font-semibold mb-2">Executive Summary</h4>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </div>

                {/* IRAC Analysis */}
                {analysis.iracAnalysis && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Legal Brief (IRAC Analysis)
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-primary">Issue</p>
                        <p className="text-sm text-muted-foreground">{analysis.iracAnalysis.issue}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Rule / Principle</p>
                        <p className="text-sm text-muted-foreground">{analysis.iracAnalysis.rule}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Application</p>
                        <p className="text-sm text-muted-foreground">{analysis.iracAnalysis.application}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Conclusion</p>
                        <p className="text-sm text-muted-foreground">{analysis.iracAnalysis.conclusion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Practice Areas */}
                <div>
                  <h4 className="font-semibold mb-2">Identified Practice Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="text-sm">
                      <Scale className="h-3 w-3 mr-1" />
                      {analysis.primaryPracticeArea} (Primary)
                    </Badge>
                    {analysis.secondaryPracticeAreas.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Legal Elements */}
                {analysis.legalElements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Legal Elements</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {analysis.legalElements.map((element, idx) => (
                        <li key={idx}>{element}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preparation Questions */}
                {analysis.preparationQuestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Questions for 30-Minute Consultation</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {analysis.preparationQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assessment */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Urgency</p>
                    <p className="font-semibold capitalize">{analysis.urgencyAssessment}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Complexity</p>
                    <p className="font-semibold capitalize">{analysis.complexityLevel}</p>
                  </div>
                  {analysis.estimatedTimeframe && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Est. Timeframe</p>
                      <p className="font-semibold">{analysis.estimatedTimeframe}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="gold" onClick={() => setStep(3)} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Submit */}
        {step === 3 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Confirm & Submit
              </CardTitle>
              <CardDescription>
                Review your case details and submit to be matched with legal professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Practice Area</p>
                  <p className="font-medium">{analysis?.primaryPracticeArea}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium capitalize">{analysis?.urgencyAssessment}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range (Optional)</Label>
                <Input
                  id="budget"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="e.g., £500 - £2,000"
                />
                <p className="text-xs text-muted-foreground">
                  Providing a budget helps firms understand your expectations
                </p>
              </div>

              {/* Document Upload */}
              {user && (
                <DocumentUpload 
                  userId={user.id}
                  onUploadComplete={(files) => setUploadedDocuments(prev => [...prev, ...files])}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              )}

              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <p className="text-sm">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Your case will be visible to verified law firms</li>
                  <li>• Matching firms will express interest</li>
                  <li>• You'll receive a free 30-minute consultation</li>
                  <li>• You decide which firm to work with</li>
                  <li>• Documents are only shared after you accept a firm</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  variant="gold" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Case
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SubmitCase;
