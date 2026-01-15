import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  File, 
  FileImage, 
  Download,
  ExternalLink,
  Lock,
  Folder,
  Share2,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { DocumentThumbnail } from '@/components/documents/DocumentThumbnail';
import { DocumentSharingControls } from '@/components/documents/DocumentSharingControls';
import { getCategoryBadge, type DocumentCategory, documentCategories } from '@/components/documents/DocumentCategorySelect';

interface CaseDocument {
  name: string;
  path: string;
  size?: number;
  type?: string;
  category?: DocumentCategory;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Preview modal state
  const [previewDocument, setPreviewDocument] = useState<CaseDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Sharing modal state
  const [sharingDocument, setSharingDocument] = useState<{ id: string; name: string } | null>(null);
  const [isSharingOpen, setIsSharingOpen] = useState(false);

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
        
        // Try to extract category from path or default to general
        const category: DocumentCategory = 'general';
        
        return {
          name: cleanName,
          path,
          type,
          category
        };
      });
      setDocuments(docs);
    }
    setIsLoading(false);
  }, [documentPaths]);

  const handlePreview = (doc: CaseDocument) => {
    setPreviewDocument(doc);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (document: CaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(document.path);

      if (error) throw error;

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

  const handleShare = (doc: CaseDocument) => {
    // Generate a temporary ID for the document based on path
    setSharingDocument({ id: doc.path, name: doc.name });
    setIsSharingOpen(true);
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === selectedCategory);

  const getCategoryCounts = () => {
    const counts: Record<string, number> = { all: documents.length };
    documentCategories.forEach(cat => {
      counts[cat.value] = documents.filter(d => d.category === cat.value).length;
    });
    return counts;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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

  const categoryCounts = getCategoryCounts();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
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
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="text-xs">
                All ({categoryCounts.all})
              </TabsTrigger>
              {documentCategories.map(cat => (
                categoryCounts[cat.value] > 0 && (
                  <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                    {cat.label} ({categoryCounts[cat.value]})
                  </TabsTrigger>
                )
              ))}
            </TabsList>
          </Tabs>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredDocuments.map((doc, idx) => (
                <div 
                  key={idx} 
                  className="group relative bg-muted/50 rounded-lg border p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <DocumentThumbnail
                      path={doc.path}
                      type={doc.type}
                      name={doc.name}
                      onClick={() => handlePreview(doc)}
                    />
                    <div className="w-full text-center">
                      <p className="text-xs font-medium truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="mt-1">
                        {getCategoryBadge(doc.category)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleShare(doc)}
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredDocuments.map((doc, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DocumentThumbnail
                      path={doc.path}
                      type={doc.type}
                      name={doc.name}
                      className="w-12 h-12"
                      onClick={() => handlePreview(doc)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {doc.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                        {getCategoryBadge(doc.category)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      title="Preview document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(doc)}
                        title="Share document"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
        document={previewDocument}
      />

      {/* Sharing Controls Modal */}
      {isOwner && sharingDocument && (
        <DocumentSharingControls
          isOpen={isSharingOpen}
          onClose={() => {
            setIsSharingOpen(false);
            setSharingDocument(null);
          }}
          documentId={sharingDocument.id}
          documentName={sharingDocument.name}
          caseId={caseId}
        />
      )}
    </>
  );
}
