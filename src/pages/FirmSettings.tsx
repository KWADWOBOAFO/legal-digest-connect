import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Scale, ArrowLeft, Save, Loader2, Plus, X, Upload, Building2, Award, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRACTICE_AREA_OPTIONS = [
  'Corporate Law', 'Criminal Law', 'Employment Law', 'Family Law',
  'Immigration Law', 'Intellectual Property', 'Personal Injury',
  'Real Estate Law', 'Tax Law', 'Environmental Law', 'Banking & Finance',
  'Healthcare Law', 'Civil Litigation', 'Contract Law'
];

interface AwardItem {
  title: string;
  organization: string;
  year: string;
  type: 'win' | 'nomination';
}

const FirmSettings = () => {
  const { user, lawFirm, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firmName, setFirmName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [consultationFee, setConsultationFee] = useState<string>('');
  const [trustpilotUrl, setTrustpilotUrl] = useState('');
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('');
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [newAward, setNewAward] = useState<AwardItem>({ title: '', organization: '', year: '', type: 'win' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && profile?.user_type !== 'firm') {
      navigate('/dashboard');
      return;
    }
  }, [user, authLoading, profile, navigate]);

  useEffect(() => {
    if (lawFirm) {
      const lf = lawFirm as any;
      setFirmName(lf.firm_name || '');
      setDescription(lf.description || '');
      setWebsite(lf.website || '');
      setAddress(lf.address || '');
      setCity(lf.city || '');
      setCountry(lf.country || '');
      setPracticeAreas(lf.practice_areas || []);
      setLogoUrl(lf.logo_url || '');
      setConsultationFee(lf.consultation_fee != null ? String(lf.consultation_fee) : '');
      setTrustpilotUrl(lf.trustpilot_url || '');
      setGoogleReviewsUrl(lf.google_reviews_url || '');
      setAwards(Array.isArray(lf.awards) ? lf.awards : []);
    }
    if (profile) {
      setPhone(profile.phone || '');
    }
  }, [lawFirm, profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lawFirm) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user!.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('firm-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('firm-logos')
        .getPublicUrl(filePath);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('law_firms')
        .update({ logo_url: publicUrl })
        .eq('id', lawFirm.id);

      if (updateError) throw updateError;

      setLogoUrl(urlWithCacheBust);
      await refreshProfile();
      toast({ title: 'Logo uploaded', description: 'Your firm logo has been updated.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Could not upload logo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAward = () => {
    if (!newAward.title.trim() || !newAward.organization.trim()) {
      toast({ title: 'Missing info', description: 'Please provide award title and organization.', variant: 'destructive' });
      return;
    }
    setAwards([...awards, newAward]);
    setNewAward({ title: '', organization: '', year: '', type: 'win' });
  };

  const handleRemoveAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!lawFirm) return;
    setIsSaving(true);

    try {
      const fee = consultationFee.trim() === '' ? null : Number(consultationFee);
      if (fee !== null && (Number.isNaN(fee) || fee < 0)) {
        toast({ title: 'Invalid fee', description: 'Consultation fee must be a positive number.', variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      const { error: firmError } = await supabase
        .from('law_firms')
        .update({
          firm_name: firmName,
          description,
          website,
          address,
          city,
          country,
          practice_areas: practiceAreas,
          consultation_fee: fee,
          trustpilot_url: trustpilotUrl || null,
          google_reviews_url: googleReviewsUrl || null,
          awards: awards as any,
        } as any)
        .eq('id', lawFirm.id);

      if (firmError) throw firmError;

      if (profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('user_id', user!.id);

        if (profileError) throw profileError;
      }

      await refreshProfile();

      toast({
        title: 'Settings saved',
        description: 'Your firm profile has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not update settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePracticeArea = (area: string) => {
    setPracticeAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
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

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Firm Settings</h1>

        {/* Logo Upload */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Firm Logo</CardTitle>
            <CardDescription>Upload your firm's logo to brand your profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoUrl} alt={firmName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                <Building2 className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload Logo</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Firm Information</CardTitle>
            <CardDescription>Update your firm's public profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firmName">Firm Name</Label>
              <Input id="firmName" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell clients about your firm..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Firm Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.yourfirm.com" />
            </div>
          </CardContent>
        </Card>

        {/* Consultation Pricing */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Consultation Pricing</CardTitle>
            <CardDescription>
              Set your standard fee for a 30-minute video consultation. Clients will see this when comparing firms.
              A 20% platform commission applies on payouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="consultationFee">Consultation Fee (£)</Label>
            <Input
              id="consultationFee"
              type="number"
              min="0"
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              placeholder="e.g. 150"
            />
            {consultationFee && !Number.isNaN(Number(consultationFee)) && Number(consultationFee) > 0 && (
              <p className="text-xs text-muted-foreground">
                You'll receive £{(Number(consultationFee) * 0.8).toFixed(2)} per consultation after the 20% platform commission.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reviews & Reputation */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Reviews & Reputation</CardTitle>
            <CardDescription>Add your public review pages so prospective clients can verify your reputation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trustpilot">Trustpilot Page URL</Label>
              <Input
                id="trustpilot"
                value={trustpilotUrl}
                onChange={(e) => setTrustpilotUrl(e.target.value)}
                placeholder="https://www.trustpilot.com/review/yourfirm.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google">Google Reviews / Business Page URL</Label>
              <Input
                id="google"
                value={googleReviewsUrl}
                onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                placeholder="https://g.page/r/your-google-review-link"
              />
            </div>
          </CardContent>
        </Card>

        {/* Awards & Nominations */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Awards & Nominations
            </CardTitle>
            <CardDescription>Showcase recognised achievements to help clients choose with confidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {awards.length > 0 && (
              <div className="space-y-2">
                {awards.map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{a.title}</span>
                        <Badge variant={a.type === 'win' ? 'default' : 'outline'} className="text-xs">
                          {a.type === 'win' ? 'Winner' : 'Nominee'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {a.organization}{a.year ? ` · ${a.year}` : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAward(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Add an award or nomination</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Award title (e.g. Law Firm of the Year)"
                  value={newAward.title}
                  onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                />
                <Input
                  placeholder="Organisation (e.g. Legal 500)"
                  value={newAward.organization}
                  onChange={(e) => setNewAward({ ...newAward, organization: e.target.value })}
                />
                <Input
                  placeholder="Year (e.g. 2024)"
                  value={newAward.year}
                  onChange={(e) => setNewAward({ ...newAward, year: e.target.value })}
                />
                <select
                  value={newAward.type}
                  onChange={(e) => setNewAward({ ...newAward, type: e.target.value as 'win' | 'nomination' })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="win">Winner</option>
                  <option value="nomination">Nominee</option>
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddAward}>
                <Plus className="h-4 w-4 mr-1" /> Add Award
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>Your contact information for client communications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 20 0000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice Areas */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Practice Areas</CardTitle>
            <CardDescription>Select the areas of law your firm specializes in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_AREA_OPTIONS.map((area) => {
                const isSelected = practiceAreas.includes(area);
                return (
                  <Badge
                    key={area}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                    onClick={() => togglePracticeArea(area)}
                  >
                    {isSelected ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    {area}
                  </Badge>
                );
              })}
            </div>
            {practiceAreas.length === 0 && (
              <p className="text-sm text-destructive mt-2">Select at least one practice area.</p>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <Button
          variant="gold"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving || practiceAreas.length === 0}
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save Settings</>
          )}
        </Button>
      </main>
    </div>
  );
};

export default FirmSettings;
