import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, File, FileImage, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentThumbnailProps {
  path: string;
  type?: string;
  name: string;
  className?: string;
  onClick?: () => void;
}

export function DocumentThumbnail({ 
  path, 
  type, 
  name, 
  className,
  onClick 
}: DocumentThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isImage = type?.startsWith('image/');
  const isPdf = type?.includes('pdf');
  const isWord = type?.includes('word') || type?.includes('document');
  const isSpreadsheet = type?.includes('spreadsheet') || type?.includes('excel');

  useEffect(() => {
    if (isImage) {
      loadThumbnail();
    }
  }, [path, isImage]);

  const loadThumbnail = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      setThumbnailUrl(data.signedUrl);
    } catch (error) {
      console.error('Thumbnail load error:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = () => {
    if (isPdf) return <FileText className="h-8 w-8 text-red-500" />;
    if (isWord) return <FileType className="h-8 w-8 text-blue-600" />;
    if (isSpreadsheet) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    if (isImage) return <FileImage className="h-8 w-8 text-purple-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const getFileColor = () => {
    if (isPdf) return 'bg-red-50 dark:bg-red-950/30';
    if (isWord) return 'bg-blue-50 dark:bg-blue-950/30';
    if (isSpreadsheet) return 'bg-green-50 dark:bg-green-950/30';
    if (isImage) return 'bg-purple-50 dark:bg-purple-950/30';
    return 'bg-muted/50';
  };

  return (
    <div 
      className={cn(
        "relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
        getFileColor(),
        className
      )}
      onClick={onClick}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      
      {isImage && thumbnailUrl && !hasError ? (
        <img 
          src={thumbnailUrl} 
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {getFileIcon()}
        </div>
      )}

      {/* File type badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 truncate px-1">
        {type?.split('/')[1]?.toUpperCase()?.substring(0, 4) || 'FILE'}
      </div>
    </div>
  );
}
