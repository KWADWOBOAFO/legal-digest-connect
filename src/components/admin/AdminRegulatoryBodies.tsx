import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Search, Shield, Globe } from 'lucide-react';

interface RegulatoryBody {
  id: string;
  name: string;
  abbreviation: string;
  country: string;
  website: string | null;
  verification_url: string | null;
  practice_areas: string[];
  description: string | null;
}

export function AdminRegulatoryBodies() {
  const [bodies, setBodies] = useState<RegulatoryBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('regulatory_bodies')
        .select('*')
        .order('abbreviation');
      if (!error) setBodies((data || []) as RegulatoryBody[]);
      setLoading(false);
    })();
  }, []);

  const filtered = bodies.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.abbreviation.toLowerCase().includes(q) ||
      b.practice_areas.some((p) => p.toLowerCase().includes(q))
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> Legal Regulatory Bodies
        </CardTitle>
        <CardDescription>
          Reference directory of regulators and professional bodies. Use these to verify firm and lawyer credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by body, abbreviation, or practice area"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No regulatory bodies match your search.</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((body) => (
              <Card key={body.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default">{body.abbreviation}</Badge>
                        <h4 className="font-semibold">{body.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{body.country}</p>
                    </div>
                    <div className="flex gap-2">
                      {body.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={body.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-3 w-3 mr-1" /> Site
                          </a>
                        </Button>
                      )}
                      {body.verification_url && (
                        <Button variant="default" size="sm" asChild>
                          <a href={body.verification_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Verify
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {body.description && (
                    <p className="text-sm text-muted-foreground">{body.description}</p>
                  )}

                  {body.practice_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {body.practice_areas.slice(0, 8).map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                      {body.practice_areas.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{body.practice_areas.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
