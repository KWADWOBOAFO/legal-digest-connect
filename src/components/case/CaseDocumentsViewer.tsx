import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download,
  Lock,
  Folder,
  Share2,
  Eye,
  Grid,
  List,
  GripVertical,
  CheckSquare,
  History,
  MessageSquare,
  Edit3,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { DocumentThumbnail } from '@/components/documents/DocumentThumbnail';
import { DocumentSharingControls } from '@/components/documents/DocumentSharingControls';
import { getCategoryBadge, type DocumentCategory, documentCategories } from '@/components/documents/DocumentCategorySelect';
import { DraggableDocumentList, type DraggableDocument } from '@/components/documents/DraggableDocumentList';
import { BulkCategoryAssignment } from '@/components/documents/BulkCategoryAssignment';
import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';
import { DocumentAnnotator } from '@/components/documents/DocumentAnnotator';
import { DocumentComments } from '@/components/documents/DocumentComments';

interface SharedDocument {
  id: string;
  name: string;
  path: string;
  size?: number;
  type?: string;
  category?: DocumentCategory;
  display_order?: number;
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
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'reorder'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Selection state for bulk operations
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Preview modal state
  const [previewDocument, setPreviewDocument] = useState<SharedDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Sharing modal state
  const [sharingDocument, setSharingDocument] = useState<{ id: string; name: string } | null>(null);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  
  // Version history modal state
  const [versionDocument, setVersionDocument] = useState<SharedDocument | null>(null);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  
  // Annotation modal state
  const [annotateDocument, setAnnotateDocument] = useState<SharedDocument | null>(null);
  const [isAnnotateOpen, setIsAnnotateOpen] = useState(false);
  
  // Comments panel state
  const [commentsDocument, setCommentsDocument] = useState<SharedDocument | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Load documents from shared_documents table or fallback to paths
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch from shared_documents table first
      const { data: sharedDocs, error } = await supabase
        .from('shared_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('display_order', { ascending: true, nullsFirst: false });
      
      if (!error && sharedDocs && sharedDocs.length > 0) {
        const docs: SharedDocument[] = sharedDocs.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          path: doc.file_path,
          size: doc.file_size || undefined,
          type: doc.mime_type || 'application/octet-stream',
          category: (doc.category as DocumentCategory) || 'general',
          display_order: doc.display_order || undefined
        }));
        setDocuments(docs);
      } else if (documentPaths && documentPaths.length > 0) {
        // Fallback to documentPaths if no shared_documents records
        const docs = documentPaths.map((path, idx) => {
          const fileName = path.split('/').pop() || path;
          const cleanName = fileName.replace(/^\d+_/, '');
          const extension = cleanName.split('.').pop()?.toLowerCase() || '';
          
          let type = 'application/octet-stream';
          if (['pdf'].includes(extension)) type = 'application/pdf';
          else if (['jpg', 'jpeg'].includes(extension)) type = 'image/jpeg';
          else if (['png'].includes(extension)) type = 'image/png';
          else if (['doc', 'docx'].includes(extension)) type = 'application/msword';
          else if (['txt'].includes(extension)) type = 'text/plain';
          
          return {
            id: `legacy-${idx}`,
            name: cleanName,
            path,
            type,
            category: 'general' as DocumentCategory,
            display_order: idx
          };
        });
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, documentPaths]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handlePreview = (doc: SharedDocument) => {
    setPreviewDocument(doc);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (document: SharedDocument) => {
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

  const handleShare = (doc: SharedDocument) => {
    setSharingDocument({ id: doc.id, name: doc.name });
    setIsSharingOpen(true);
  };

  const handleVersionHistory = (doc: SharedDocument) => {
    setVersionDocument(doc);
    setIsVersionOpen(true);
  };

  const handleAnnotate = (doc: SharedDocument) => {
    setAnnotateDocument(doc);
    setIsAnnotateOpen(true);
  };

  const handleComments = (doc: SharedDocument) => {
    setCommentsDocument(doc);
    setIsCommentsOpen(true);
  };

  const handleReorder = async (reorderedDocs: DraggableDocument[]) => {
    // Convert back to SharedDocument format
    const updatedDocs: SharedDocument[] = reorderedDocs.map(doc => ({
      id: doc.id,
      name: doc.name,
      path: doc.path,
      type: doc.type,
      category: doc.category,
      display_order: doc.displayOrder
    }));
    
    setDocuments(updatedDocs);
    
    // Update display_order in database
    for (let i = 0; i < reorderedDocs.length; i++) {
      const doc = reorderedDocs[i];
      if (!doc.id.startsWith('legacy-')) {
        await supabase
          .from('shared_documents')
          .update({ display_order: i })
          .eq('id', doc.id);
      }
    }
    
    toast({
      title: "Order saved",
      description: "Document order has been updated"
    });
  };

  const handleBulkCategoryAssign = async (category: DocumentCategory) => {
    // Update documents in state
    setDocuments(prev => 
      prev.map(doc => 
        selectedDocIds.has(doc.id) ? { ...doc, category } : doc
      )
    );
    
    // Update in database
    for (const docId of Array.from(selectedDocIds)) {
      if (!docId.startsWith('legacy-')) {
        await supabase
          .from('shared_documents')
          .update({ category })
          .eq('id', docId);
      }
    }
    
    setSelectedDocIds(new Set());
    setIsBulkModalOpen(false);
    
    toast({
      title: "Categories updated",
      description: `Updated ${selectedDocIds.size} document(s)`
    });
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // Convert SharedDocument to DraggableDocument for the draggable list
  const toDraggableDocument = (doc: SharedDocument): DraggableDocument => ({
    id: doc.id,
    name: doc.name,
    path: doc.path,
    type: doc.type,
    category: doc.category,
    displayOrder: doc.display_order || 0
  });

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
          <div className="flex items-center justify-between flex-wrap gap-2">
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
              {isOwner && selectedDocIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Assign Category ({selectedDocIds.size})
                </Button>
              )}
              {isOwner && (
                <Button
                  variant={viewMode === 'reorder' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'reorder' ? 'grid' : 'reorder')}
                  title="Reorder documents"
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              )}
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

          {/* Reorder View */}
          {viewMode === 'reorder' && isOwner ? (
            <DraggableDocumentList
              documents={filteredDocuments.map(toDraggableDocument)}
              onReorder={handleReorder}
              selectedIds={selectedDocIds}
              onSelectionChange={setSelectedDocIds}
              onPreview={(doc) => handlePreview({ ...doc, display_order: doc.displayOrder })}
              onDownload={(doc) => handleDownload({ ...doc, display_order: doc.displayOrder })}
              onShare={isOwner ? (doc) => handleShare({ ...doc, display_order: doc.displayOrder }) : undefined}
              onVersionHistory={isOwner ? (doc) => handleVersionHistory({ ...doc, display_order: doc.displayOrder }) : undefined}
              onAnnotate={(isFirm || isOwner) ? (doc) => handleAnnotate({ ...doc, display_order: doc.displayOrder }) : undefined}
              showActions={true}
            />
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`group relative bg-muted/50 rounded-lg border p-3 hover:border-primary/30 transition-colors ${
                    selectedDocIds.has(doc.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {isOwner && (
                    <div 
                      className="absolute top-2 left-2 z-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDocSelection(doc.id);
                      }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedDocIds.has(doc.id) 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground/50 hover:border-primary'
                      }`}>
                        {selectedDocIds.has(doc.id) && <CheckSquare className="h-3 w-3" />}
                      </div>
                    </div>
                  )}
                  
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
                  <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-lg p-2">
                    <div className="flex items-center gap-1">
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
                    </div>
                    <div className="flex items-center gap-1">
                      {(isFirm || isOwner) && !doc.id.startsWith('legacy-') && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAnnotate(doc)}
                            title="Annotate"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleComments(doc)}
                            title="Comments"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    {isOwner && !doc.id.startsWith('legacy-') && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVersionHistory(doc)}
                          title="Version History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleShare(doc)}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors ${
                    selectedDocIds.has(doc.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOwner && (
                      <div 
                        className="cursor-pointer"
                        onClick={() => toggleDocSelection(doc.id)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedDocIds.has(doc.id) 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-muted-foreground/50 hover:border-primary'
                        }`}>
                          {selectedDocIds.has(doc.id) && <CheckSquare className="h-3 w-3" />}
                        </div>
                      </div>
                    )}
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
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {(isFirm || isOwner) && !doc.id.startsWith('legacy-') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnnotate(doc)}
                          title="Annotate"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComments(doc)}
                          title="Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isOwner && !doc.id.startsWith('legacy-') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVersionHistory(doc)}
                          title="Version History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(doc)}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
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
        document={previewDocument ? {
          name: previewDocument.name,
          path: previewDocument.path,
          type: previewDocument.type
        } : null}
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

      {/* Bulk Category Assignment Modal */}
      <BulkCategoryAssignment
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setSelectedDocIds(new Set());
        }}
        selectedCount={selectedDocIds.size}
        onAssign={handleBulkCategoryAssign}
      />

      {/* Version History Modal */}
      {isOwner && versionDocument && !versionDocument.id.startsWith('legacy-') && (
        <DocumentVersionHistory
          isOpen={isVersionOpen}
          onClose={() => {
            setIsVersionOpen(false);
            setVersionDocument(null);
          }}
          documentId={versionDocument.id}
          documentName={versionDocument.name}
          currentPath={versionDocument.path}
          onVersionChange={loadDocuments}
        />
      )}

      {/* Annotation Modal */}
      {annotateDocument && !annotateDocument.id.startsWith('legacy-') && (
        <DocumentAnnotator
          isOpen={isAnnotateOpen}
          onClose={() => {
            setIsAnnotateOpen(false);
            setAnnotateDocument(null);
          }}
          documentId={annotateDocument.id}
          documentName={annotateDocument.name}
          documentPath={annotateDocument.path}
          documentType={annotateDocument.type}
        />
      )}

      {/* Comments Panel */}
      {commentsDocument && !commentsDocument.id.startsWith('legacy-') && (
        <DocumentComments
          isOpen={isCommentsOpen}
          onClose={() => {
            setIsCommentsOpen(false);
            setCommentsDocument(null);
          }}
          documentId={commentsDocument.id}
          documentName={commentsDocument.name}
        />
      )}
    </>
  );
}
