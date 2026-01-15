import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  File, 
  FileImage, 
  Download,
  ExternalLink,
  Lock,
  Folder
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaseDocument {
  name: string;
  path: string;
  size?: number;
  type?: string;
}

interface CaseDocumentsViewerProps {
  caseId: string;
  documentPaths: string[];
  isOwner?: boolean;
  isFirm?: boolean;
}

export function CaseDocumentsViewer({ 
  caseId, 
  documentPaths, 
  isOwner = false,
  isFirm = false 
}: CaseDocumentsViewerProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (documentPaths && documentPaths.length > 0) {
      const docs = documentPaths.map(path => {
        const fileName = path.split('/').pop() || path;
        // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf" -> "filename.pdf")
        const cleanName = fileName.replace(/^\d+_/, '');
        const extension = cleanName.split('.').pop()?.toLowerCase() || '';
        
        let type = 'application/octet-stream';
        if (['pdf'].includes(extension)) type = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(extension)) type = 'image/jpeg';
        else if (['png'].includes(extension)) type = 'image/png';
        else if (['doc', 'docx'].includes(extension)) type = 'application/msword';
        else if (['txt'].includes(extension)) type = 'text/plain';
        
        return {
          name: cleanName,
          path,
          type
        };
      });
      setDocuments(docs);
    }
    setIsLoading(false);
  }, [documentPaths]);

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-5 w-5" />;
    if (type.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5" />;
  };

  const handleDownload = async (document: CaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(document.path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${document.name}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the document. You may not have access.",
        variant: "destructive"
      });
    }
  };

  const handleView = async (document: CaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.path, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Could not open document",
        description: "You may not have access to view this document.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documentPaths || documentPaths.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="h-5 w-5" />
            Case Documents
          </CardTitle>
          <CardDescription>
            No documents have been uploaded for this case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No documents attached</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Folder className="h-5 w-5" />
          Case Documents
          <Badge variant="secondary" className="ml-2">
            {documents.length} file{documents.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isFirm 
            ? "Review the documents provided by the client to assess this case"
            : isOwner 
              ? "Documents you've uploaded for this case"
              : "Supporting documents for this case"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(doc.type)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(doc)}
                  title="View document"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {isFirm && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-3 w-3" />
              These documents are shared securely and confidentially for case review purposes only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
