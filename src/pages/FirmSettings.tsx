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
import { Scale, ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRACTICE_AREA_OPTIONS = [
  'Corporate Law', 'Criminal Law', 'Employment Law', 'Family Law',
  'Immigration Law', 'Intellectual Property', 'Personal Injury',
  'Real Estate Law', 'Tax Law', 'Environmental Law', 'Banking & Finance',
  'Healthcare Law', 'Civil Litigation', 'Contract Law'
];

const FirmSettings = () => {
  const { user, lawFirm, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firmName, setFirmName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      setFirmName(lawFirm.firm_name || '');
      setDescription(lawFirm.description || '');
      setWebsite((lawFirm as any).website || '');
      setAddress((lawFirm as any).address || '');
      setCity((lawFirm as any).city || '');
      setCountry((lawFirm as any).country || '');
      setPracticeAreas(lawFirm.practice_areas || []);
    }
    if (profile) {
      setPhone(profile.phone || '');
    }
  }, [lawFirm, profile]);

  const handleSave = async () => {
    if (!lawFirm) return;
    setIsSaving(true);

    try {
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
        })
        .eq('id', lawFirm.id);

      if (firmError) throw firmError;

      // Update phone on profile
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
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
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
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
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
            <CardDescription>Select the areas of law your firm specializes in. This determines which cases you'll see.</CardDescription>
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
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </main>
    </div>
  );
};

export default FirmSettings;
