import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Star, 
  Scale,
  Building2,
  Filter
} from 'lucide-react';

interface LawFirm {
  id: string;
  firm_name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  practice_areas: string[];
  is_verified: boolean;
}

const Firms = () => {
  const navigate = useNavigate();
  const [firms, setFirms] = useState<LawFirm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('is_verified', true)
        .order('firm_name');

      if (error) throw error;
      setFirms(data || []);
    } catch (error) {
      console.error('Error fetching firms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFirms = firms.filter(firm => {
    const matchesSearch = firm.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firm.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPracticeArea = practiceAreaFilter === 'all' || 
      firm.practice_areas?.includes(practiceAreaFilter);
    const matchesLocation = !locationFilter || 
      firm.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      firm.country?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesPracticeArea && matchesLocation;
  });

  const allPracticeAreas = [...new Set(firms.flatMap(f => f.practice_areas || []))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-hero-gradient text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find the Right Legal Expertise
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Browse our network of verified law firms and legal professionals, 
              filtered by practice area and location.
            </p>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="py-8 border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search firms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10 w-full md:w-48"
                />
              </div>
              <select
                value={practiceAreaFilter}
                onChange={(e) => setPracticeAreaFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="all">All Practice Areas</option>
                {allPracticeAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Firms Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Scale className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading law firms...</p>
              </div>
            ) : filteredFirms.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No firms found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || practiceAreaFilter !== 'all' || locationFilter
                    ? 'Try adjusting your search filters'
                    : 'Be the first law firm to join our network'}
                </p>
                <Button variant="gold" className="mt-4" onClick={() => navigate('/auth')}>
                  Register Your Firm
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFirms.map((firm) => (
                  <Card key={firm.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{firm.firm_name}</CardTitle>
                            {(firm.city || firm.country) && (
                              <CardDescription className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[firm.city, firm.country].filter(Boolean).join(', ')}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        {firm.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {firm.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {firm.description}
                        </p>
                      )}
                      
                      {/* Practice Areas */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {firm.practice_areas?.slice(0, 3).map((area, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {firm.practice_areas && firm.practice_areas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{firm.practice_areas.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Rating Placeholder */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                        <span className="text-xs">(12 reviews)</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Firms;
