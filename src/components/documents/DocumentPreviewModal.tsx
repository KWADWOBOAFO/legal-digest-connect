import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  File, 
  FileImage,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    path: string;
    type?: string;
    category?: string;
  } | null;
}

export function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  document 
}: DocumentPreviewModalProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document]);

  const loadPreview = async () => {
    if (!document) return;
    
    setIsLoading(true);
    setZoom(100);
    setRotation(0);
    
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.path, 3600);

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Preview load error:', error);
      toast({
        title: "Preview failed",
        description: "Could not load document preview.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    
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
        description: "Could not download the document.",
        variant: "destructive"
      });
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const isImage = document?.type?.startsWith('image/');
  const isPdf = document?.type?.includes('pdf');

  const getFileIcon = () => {
    if (!document?.type) return <File className="h-16 w-16" />;
    if (document.type.startsWith('image/')) return <FileImage className="h-16 w-16 text-blue-500" />;
    if (document.type.includes('pdf')) return <FileText className="h-16 w-16 text-red-500" />;
    return <File className="h-16 w-16" />;
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      contracts: 'Contracts',
      evidence: 'Evidence',
      correspondence: 'Correspondence',
      financial: 'Financial',
      identification: 'Identification',
      general: 'General'
    };
    return labels[category || 'general'] || 'General';
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      contracts: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      evidence: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      correspondence: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      financial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      identification: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[category || 'general'] || colors.general;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3 min-w-0">
              <DialogTitle className="truncate">{document?.name}</DialogTitle>
              {document?.category && (
                <Badge className={getCategoryColor(document.category)}>
                  {getCategoryLabel(document.category)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Skeleton className="w-full h-full" />
            </div>
          ) : isImage && previewUrl ? (
            <div className="relative h-[60vh] flex items-center justify-center bg-muted/30 rounded-lg overflow-auto">
              <img 
                src={previewUrl} 
                alt={document?.name}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{ 
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          ) : isPdf && previewUrl ? (
            <div className="h-[60vh] bg-muted/30 rounded-lg overflow-hidden">
              <iframe 
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title={document?.name}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-muted/30 rounded-lg">
              {getFileIcon()}
              <p className="mt-4 text-muted-foreground">
                Preview not available for this file type
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Open in New Tab" or "Download" to view the file
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          {isImage && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!isImage && <div />}
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
