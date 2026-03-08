import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Star, 
  Users,
  CheckCircle2,
  Loader2,
  Building2,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  logo_url: string | null;
  regulatory_body: string | null;
  regulatory_number: string | null;
}

const REGULATORY_BODY_LABELS: Record<string, string> = {
  sra: 'SRA — Solicitors Regulation Authority',
  bsb: 'BSB — Bar Standards Board',
  cilex: 'CILEx Regulation',
  law_society: 'The Law Society',
  lsra: 'LSRA — Legal Services Regulatory Authority',
  iaa: 'IAA — Immigration Advisers Authority',
  oisc: 'OISC — Office of the Immigration Services Commissioner',
  other: 'Other Regulatory Body',
};

interface LegalProfessional {
  id: string;
  full_name: string;
  title: string | null;
  specializations: string[];
  bio: string | null;
  years_experience: number | null;
  avatar_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  user_name?: string;
}

const FirmProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [firm, setFirm] = useState<LawFirm | null>(null);
  const [professionals, setProfessionals] = useState<LegalProfessional[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchFirmData();
    }
  }, [id]);

  const fetchFirmData = async () => {
    try {
      // Fetch firm details
      const { data: firmData, error: firmError } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', id)
        .single();

      if (firmError) throw firmError;
      setFirm(firmData);

      // Fetch team members
      const { data: professionalsData } = await supabase
        .from('legal_professionals')
        .select('*')
        .eq('firm_id', id)
        .eq('is_active', true);

      setProfessionals(professionalsData || []);

      // Fetch reviews (non-anonymous only for public view, or all if firm owner)
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('firm_id', id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        // Calculate average rating
        const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(reviewsData.length > 0 ? totalRating / reviewsData.length : 0);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching firm data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Firm Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The firm you're looking for doesn't exist or is not publicly visible.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Scale className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">DEBRIEFED</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Firm Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo/Avatar */}
              <div className="flex-shrink-0">
                {firm.logo_url ? (
                  <img 
                    src={firm.logo_url} 
                    alt={firm.firm_name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>
              
              {/* Firm Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{firm.firm_name}</h1>
                  {firm.is_verified && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {/* Rating */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(Math.round(averageRating))}
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                )}
                
                {/* Location */}
                {(firm.city || firm.country) && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{[firm.city, firm.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {/* Website */}
                {firm.website && (
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={firm.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {firm.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Regulatory Info */}
                {firm.regulatory_body && (
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Regulated by{' '}
                      <span className="font-medium">
                        {REGULATORY_BODY_LABELS[firm.regulatory_body] || firm.regulatory_body}
                      </span>
                      {firm.regulatory_number && (
                        <span className="text-muted-foreground"> — Reg. No. {firm.regulatory_number}</span>
                      )}
                    </span>
                  </div>
                )}
                
                {/* Practice Areas */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {firm.practice_areas?.map((area, idx) => (
                    <Badge key={idx} variant="outline">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Description */}
            {firm.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{firm.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        {professionals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Our Team ({professionals.length})
              </CardTitle>
              <CardDescription>Meet our legal professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {professionals.map((professional) => (
                  <div 
                    key={professional.id}
                    className="flex gap-4 p-4 rounded-lg border bg-card"
                  >
                    {professional.avatar_url ? (
                      <img 
                        src={professional.avatar_url}
                        alt={professional.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-semibold text-primary">
                          {professional.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{professional.full_name}</h4>
                      {professional.title && (
                        <p className="text-sm text-muted-foreground">{professional.title}</p>
                      )}
                      {professional.years_experience && (
                        <p className="text-sm text-muted-foreground">
                          {professional.years_experience} years experience
                        </p>
                      )}
                      {professional.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {professional.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews ({reviews.length})
            </CardTitle>
            {reviews.length > 0 && (
              <CardDescription>
                Average rating: {averageRating.toFixed(1)} out of 5
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {review.is_anonymous ? 'Anonymous' : 'Verified Client'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="text-muted-foreground">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FirmProfile;
