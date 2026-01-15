import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  History, 
  Download, 
  Eye, 
  Upload, 
  CheckCircle2,
  Clock,
  FileUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DocumentVersion {
  id: string;
  version_number: number;
  file_path: string;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
  is_current: boolean;
}

interface DocumentVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  currentPath: string;
  onVersionChange?: () => void;
}

export function DocumentVersionHistory({
  isOpen,
  onClose,
  documentId,
  documentName,
  currentPath,
  onVersionChange
}: DocumentVersionHistoryProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      // If no versions exist yet, the document itself is version 1
      setVersions([{
        id: 'current',
        version_number: 1,
        file_path: currentPath,
        file_size: null,
        uploaded_by: user?.id || '',
        uploaded_at: new Date().toISOString(),
        is_current: true
      }]);
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

  const uploadNewVersion = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${timestamp}_v${versions.length + 1}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Mark all existing versions as not current
      if (versions.length > 0 && versions[0].id !== 'current') {
        await supabase
          .from('document_versions')
          .update({ is_current: false })
          .eq('document_id', documentId);
      }

      // If this is the first version entry, also add the original as version 1
      if (versions.length === 1 && versions[0].id === 'current') {
        await supabase
          .from('document_versions')
          .insert({
            document_id: documentId,
            version_number: 1,
            file_path: currentPath,
            uploaded_by: user.id,
            is_current: false
          });
      }

      // Insert new version
      const newVersionNumber = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 2;

      const { error: insertError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: newVersionNumber,
          file_path: filePath,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          is_current: true
        });

      if (insertError) throw insertError;

      // Update the main document's file_path
      await supabase
        .from('shared_documents')
        .update({ file_path: filePath })
        .eq('id', documentId);

      toast({
        title: 'New version uploaded',
        description: `Version ${newVersionNumber} has been uploaded successfully.`
      });

      setSelectedFile(null);
      fetchVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Error uploading version:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload new version.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `v${version.version_number}_${documentName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Downloading version ${version.version_number}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download this version.',
        variant: 'destructive'
      });
    }
  };

  const previewVersion = async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(version.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: 'Preview failed',
        description: 'Could not preview this version.',
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and manage versions of "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Upload New Version */}
          <div className="p-4 border-2 border-dashed rounded-lg">
            <div className="flex items-center gap-3">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="version-upload" className="font-medium">
                  Upload New Version
                </Label>
                <Input
                  id="version-upload"
                  type="file"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
              </div>
            </div>
            {selectedFile && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
                <Button 
                  size="sm" 
                  onClick={uploadNewVersion}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            )}
          </div>

          {/* Version List */}
          <div>
            <h4 className="text-sm font-medium mb-2">All Versions</h4>
            <ScrollArea className="max-h-[300px]">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <span className="text-sm font-bold text-primary">
                            v{version.version_number}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              Version {version.version_number}
                            </span>
                            {version.is_current && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(version.uploaded_at), 'MMM d, yyyy h:mm a')}
                            {version.file_size && (
                              <span>• {formatFileSize(version.file_size)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewVersion(version)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadVersion(version)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
