import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Lock, 
  Share2,
  File,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SharedDocument {
  id: string;
  case_id: string | null;
  conversation_id: string | null;
  uploaded_by: string;
  uploader_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  is_encrypted: boolean;
  shared_with_client: boolean;
  shared_with_firm: boolean;
  created_at: string;
}

interface SecureDocumentShareProps {
  caseId?: string;
  conversationId?: string;
}

export function SecureDocumentShare({ caseId, conversationId }: SecureDocumentShareProps) {
  const { user, profile, lawFirm } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareWithClient, setShareWithClient] = useState(false);
  const [shareWithFirm, setShareWithFirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isClient = profile?.user_type === 'individual';
  const uploaderType = isClient ? 'client' : 'firm';

  useEffect(() => {
    fetchDocuments();
  }, [caseId, conversationId]);

  const fetchDocuments = async () => {
    try {
      let query = supabase.from('shared_documents').select('*');
      
      if (caseId) {
        query = query.eq('case_id', caseId);
      }
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('shared_documents')
        .insert({
          case_id: caseId || null,
          conversation_id: conversationId || null,
          uploaded_by: user.id,
          uploader_type: uploaderType,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          is_encrypted: true,
          shared_with_client: shareWithClient,
          shared_with_firm: shareWithFirm
        });

      if (dbError) throw dbError;

      toast({
        title: 'Document uploaded',
        description: 'Your document has been securely uploaded.'
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setShareWithClient(false);
      setShareWithFirm(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc: SharedDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const deleteDocument = async (doc: SharedDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: dbError } = await supabase
        .from('shared_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.'
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="border-b py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Secure Documents
          </CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Secure Document</DialogTitle>
                <DialogDescription>
                  Documents are encrypted and stored securely. Choose who can access this document.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Share With</Label>
                  {!isClient && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shareClient"
                        checked={shareWithClient}
                        onCheckedChange={(checked) => setShareWithClient(checked as boolean)}
                      />
                      <label htmlFor="shareClient" className="text-sm">
                        Share with client
                      </label>
                    </div>
                  )}
                  {isClient && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shareFirm"
                        checked={shareWithFirm}
                        onCheckedChange={(checked) => setShareWithFirm(checked as boolean)}
                      />
                      <label htmlFor="shareFirm" className="text-sm">
                        Share with law firm
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    All documents are encrypted at rest and in transit
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={uploadDocument} disabled={!selectedFile || uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center">
              <File className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No documents shared yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                          </span>
                          {doc.is_encrypted && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {doc.shared_with_client && (
                            <Badge variant="outline" className="text-xs">
                              <Share2 className="h-3 w-3 mr-1" />
                              Client
                            </Badge>
                          )}
                          {doc.shared_with_firm && (
                            <Badge variant="outline" className="text-xs">
                              <Share2 className="h-3 w-3 mr-1" />
                              Firm
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.uploaded_by === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
