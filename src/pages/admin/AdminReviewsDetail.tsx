import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  user_id: string;
  firm_id: string;
  rating: number;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export default function AdminReviewsDetail() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [firms, setFirms] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => { if (!roleLoading && !isAdmin) navigate('/admin'); }, [isAdmin, roleLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
    const ch = supabase.channel('admin-reviews-detail').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const fetchData = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    const r = data || [];
    setReviews(r);

    const userIds = [...new Set(r.map(x => x.user_id))];
    const firmIds = [...new Set(r.map(x => x.firm_id))];

    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds.length ? userIds : ['']),
      supabase.from('law_firms').select('id, firm_name').in('id', firmIds.length ? firmIds : ['']),
    ]);

    if (p) { const m: Record<string, string> = {}; p.forEach(x => { m[x.user_id] = x.full_name || x.email; }); setProfiles(m); }
    if (f) { const m: Record<string, string> = {}; f.forEach(x => { m[x.id] = x.firm_name; }); setFirms(m); }
    setIsLoading(false);
  };

  const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: reviews.filter(x => x.rating === r).length }));

  const filtered = reviews.filter(r => {
    if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (r.review_text || '').toLowerCase().includes(term) || (profiles[r.user_id] || '').toLowerCase().includes(term) || (firms[r.firm_id] || '').toLowerCase().includes(term);
    }
    return true;
  });

  if (roleLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Star className="h-6 w-6" /> Reviews Overview</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-4xl font-bold">{avgRating}</p>
              <div className="flex justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Average from {reviews.length} reviews</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6 space-y-2">
              {ratingDist.map(({ rating, count }) => {
                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8">{rating}★</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-yellow-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by review text, user, or firm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
                <option value="all">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Reviews ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No reviews found.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Firm</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Anonymous</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{r.is_anonymous ? 'Anonymous' : (profiles[r.user_id] || r.user_id.slice(0, 8))}</TableCell>
                        <TableCell className="text-sm">{firms[r.firm_id] || r.firm_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{r.review_text || '—'}</TableCell>
                        <TableCell>{r.is_anonymous ? <Badge variant="secondary" className="text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>}</TableCell>
                        <TableCell className="text-sm">{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
