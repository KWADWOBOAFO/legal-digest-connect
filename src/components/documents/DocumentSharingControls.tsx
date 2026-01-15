import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Share2, 
  Building2, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MatchedFirm {
  id: string;
  firm_name: string;
  status: string;
  firm_id: string;
}

interface DocumentSharingControlsProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  caseId: string;
  currentShares?: string[]; // Array of firm IDs currently shared with
  onSharesUpdated?: () => void;
}

export function DocumentSharingControls({
  isOpen,
  onClose,
  documentId,
  documentName,
  caseId,
  currentShares = [],
  onSharesUpdated
}: DocumentSharingControlsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [matchedFirms, setMatchedFirms] = useState<MatchedFirm[]>([]);
  const [selectedFirms, setSelectedFirms] = useState<Set<string>>(new Set(currentShares));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMatchedFirms();
      setSelectedFirms(new Set(currentShares));
    }
  }, [isOpen, caseId, currentShares]);

  const fetchMatchedFirms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_matches')
        .select(`
          id,
          status,
          firm_id,
          law_firms:firm_id (
            id,
            firm_name
          )
        `)
        .eq('case_id', caseId);

      if (error) throw error;

      const firms = data?.map(match => ({
        id: match.id,
        firm_id: match.firm_id,
        firm_name: (match.law_firms as any)?.firm_name || 'Unknown Firm',
        status: match.status
      })) || [];

      setMatchedFirms(firms);
    } catch (error) {
      console.error('Error fetching matched firms:', error);
      toast({
        title: "Error",
        description: "Could not load matched firms.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFirm = (firmId: string) => {
    const newSelected = new Set(selectedFirms);
    if (newSelected.has(firmId)) {
      newSelected.delete(firmId);
    } else {
      newSelected.add(firmId);
    }
    setSelectedFirms(newSelected);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Get current shares from database
      const { data: existingShares, error: fetchError } = await supabase
        .from('document_firm_shares')
        .select('firm_id')
        .eq('document_id', documentId);

      if (fetchError) throw fetchError;

      const existingFirmIds = new Set(existingShares?.map(s => s.firm_id) || []);
      
      // Determine what to add and what to remove
      const toAdd = [...selectedFirms].filter(id => !existingFirmIds.has(id));
      const toRemove = [...existingFirmIds].filter(id => !selectedFirms.has(id));

      // Add new shares
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('document_firm_shares')
          .insert(toAdd.map(firmId => ({
            document_id: documentId,
            firm_id: firmId,
            shared_by: user.id
          })));

        if (insertError) throw insertError;
      }

      // Remove old shares
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('document_firm_shares')
          .delete()
          .eq('document_id', documentId)
          .in('firm_id', toRemove);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Sharing updated",
        description: `Document sharing has been updated for ${selectedFirms.size} firm(s).`
      });

      onSharesUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating shares:', error);
      toast({
        title: "Error",
        description: "Could not update document sharing.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      interested: { variant: 'secondary', label: 'Interested' },
      accepted: { variant: 'default', label: 'Accepted' },
      declined: { variant: 'outline', label: 'Declined' }
    };
    const config = variants[status] || variants.interested;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Choose which law firms can access "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : matchedFirms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No firms have expressed interest in this case yet.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {matchedFirms.map((firm) => (
                  <div
                    key={firm.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`firm-${firm.firm_id}`}
                        checked={selectedFirms.has(firm.firm_id)}
                        onCheckedChange={() => toggleFirm(firm.firm_id)}
                      />
                      <Label 
                        htmlFor={`firm-${firm.firm_id}`}
                        className="flex flex-col gap-1 cursor-pointer"
                      >
                        <span className="font-medium">{firm.firm_name}</span>
                        {getStatusBadge(firm.status)}
                      </Label>
                    </div>
                    {selectedFirms.has(firm.firm_id) && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Only selected firms will be able to view and download this document.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || matchedFirms.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
