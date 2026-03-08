import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Building2, FileCheck, Shield, ArrowRight, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REGULATORY_BODIES = [
  { value: 'sra', label: 'SRA — Solicitors Regulation Authority' },
  { value: 'bsb', label: 'BSB — Bar Standards Board' },
  { value: 'cilex', label: 'CILEx Regulation' },
  { value: 'law_society', label: 'The Law Society' },
  { value: 'lsra', label: 'LSRA — Legal Services Regulatory Authority (Ireland)' },
  { value: 'iaa', label: 'IAA — Immigration Advisers Authority' },
  { value: 'oisc', label: 'OISC — Office of the Immigration Services Commissioner' },
  { value: 'other', label: 'Other Regulatory Body' },
];

const PRACTICE_AREAS = [
  "Criminal Law", "Contract Law", "Family Law", "Property Law", "Tax Law",
  "Cyber Crime Law", "Tort Law", "Intellectual Property Law", "Immigration Law",
  "Employment Law", "Commercial Law", "Company Law", "Maritime Law",
  "Wills, Trust and Probate Law", "Environmental Law", "Sports Law",
  "Media and Entertainment Law", "Banking and Finance Law", "Technology and AI Law",
  "Construction Law", "Personal Injury Law", "Clinical Negligence",
  "Human Rights Law", "Constitutional and Administrative Law", "ADR Law"
];

interface FirmOnboardingProps {
  lawFirm: {
    id: string;
    firm_name: string;
    is_verified: boolean;
    nda_signed: boolean;
  } | null;
  onComplete: () => void;
}

const FirmOnboarding = ({ lawFirm, onComplete }: FirmOnboardingProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(lawFirm ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Firm details form
  const [firmName, setFirmName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [regulatoryBody, setRegulatoryBody] = useState('');
  const [regulatoryNumber, setRegulatoryNumber] = useState('');
  
  // NDA acceptance
  const [ndaAccepted, setNdaAccepted] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateFirm = async () => {
    if (!user || selectedAreas.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one practice area.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('law_firms')
        .insert({
          user_id: user.id,
          firm_name: firmName || profile?.full_name || 'My Law Firm',
          description,
          website,
          address,
          city,
          country,
          practice_areas: selectedAreas,
          regulatory_body: regulatoryBody || null,
          regulatory_number: regulatoryNumber || null,
          is_verified: false,
          nda_signed: false
        });

      if (error) throw error;

      toast({
        title: "Firm profile created",
        description: "Now please review and accept the NDA."
      });
      
      setStep(2);
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create firm profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignNDA = async () => {
    if (!lawFirm || !ndaAccepted) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('law_firms')
        .update({
          nda_signed: true,
          nda_signed_at: new Date().toISOString()
          // Note: is_verified remains false - requires manual admin verification
        })
        .eq('id', lawFirm.id);

      if (error) throw error;

      toast({
        title: "NDA Signed Successfully",
        description: "Your firm is now pending verification. You'll be notified once verified by our team."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign NDA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePracticeArea = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DEBRIEFED</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <Building2 className="h-5 w-5" />
            <span className="hidden sm:inline">Firm Details</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <FileCheck className="h-5 w-5" />
            <span className="hidden sm:inline">NDA Agreement</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <Shield className="h-5 w-5" />
            <span className="hidden sm:inline">Verified</span>
          </div>
        </div>

        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Complete Your Firm Profile</CardTitle>
              <CardDescription>
                Provide details about your law firm to start matching with clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name *</Label>
                <Input
                  id="firmName"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Smith & Associates LLP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">About Your Firm</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential clients about your firm's experience and expertise..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="London"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United Kingdom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourfirm.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Practice Areas * (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {PRACTICE_AREAS.map((area) => (
                    <label
                      key={area}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedAreas.includes(area) 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={selectedAreas.includes(area)}
                        onCheckedChange={() => togglePracticeArea(area)}
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedAreas.length} area(s)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regulatoryBody">Regulatory Body *</Label>
                <Select value={regulatoryBody} onValueChange={setRegulatoryBody}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your regulatory body" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGULATORY_BODIES.map((body) => (
                      <SelectItem key={body.value} value={body.value}>
                        {body.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All firms must be regulated by an approved legal regulatory authority.
                </p>
              </div>

              <Button 
                variant="gold" 
                className="w-full"
                onClick={handleCreateFirm}
                disabled={isSubmitting || !firmName || selectedAreas.length === 0 || !regulatoryBody}
              >
                {isSubmitting ? 'Creating Profile...' : 'Continue to NDA'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Non-Disclosure Agreement</CardTitle>
              <CardDescription>
                Please review and accept our NDA to protect client confidentiality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto text-sm">
                <h4 className="font-semibold mb-2">DEBRIEFED Platform Non-Disclosure Agreement</h4>
                <p className="mb-2">
                  By accepting this agreement, you acknowledge and agree to the following terms:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>Confidentiality:</strong> All client information, case details, and personal data accessed through the DEBRIEFED platform shall be treated as strictly confidential.
                  </li>
                  <li>
                    <strong>Data Protection:</strong> You agree to comply with all applicable data protection laws, including GDPR, and maintain appropriate security measures for all client data.
                  </li>
                  <li>
                    <strong>Limited Use:</strong> Client information shall only be used for the purpose of providing legal services and shall not be shared with third parties without explicit consent.
                  </li>
                  <li>
                    <strong>Security Obligations:</strong> You shall maintain reasonable security practices and promptly report any data breaches or security incidents.
                  </li>
                  <li>
                    <strong>Professional Standards:</strong> You confirm that all legal professionals in your firm are properly regulated by their respective governing body (e.g., SRA — Solicitors Regulation Authority, The Law Society, BSB — Bar Standards Board, CILEx Regulation, or equivalent regulatory authority) and will adhere to their professional conduct rules and codes of practice.
                  </li>
                  <li>
                    <strong>Term:</strong> This agreement remains in effect for the duration of your subscription and continues after termination with respect to information received during the subscription period.
                  </li>
                </ol>
              </div>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={ndaAccepted}
                  onCheckedChange={(checked) => setNdaAccepted(checked as boolean)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">I accept the Non-Disclosure Agreement</p>
                  <p className="text-sm text-muted-foreground">
                    I confirm that I have read, understood, and agree to be bound by the terms of this NDA on behalf of my firm.
                  </p>
                </div>
              </label>

              <Button 
                variant="gold" 
                className="w-full"
                onClick={handleSignNDA}
                disabled={isSubmitting || !ndaAccepted}
              >
                {isSubmitting ? 'Processing...' : 'Sign NDA & Complete Setup'}
                <Shield className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default FirmOnboarding;
