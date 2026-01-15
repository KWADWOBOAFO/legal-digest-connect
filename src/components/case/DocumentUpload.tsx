import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  File,
  FileImage
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentCategorySelect, type DocumentCategory } from '@/components/documents/DocumentCategorySelect';

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  category?: DocumentCategory;
}

interface DocumentUploadProps {
  userId: string;
  caseId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  showCategories?: boolean;
}

const DocumentUpload = ({ 
  userId, 
  caseId,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
  showCategories = true
}: DocumentUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategories, setFileCategories] = useState<Map<number, DocumentCategory>>(new Map());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: string[] = [];
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      // Check type
      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name}: File type not allowed`);
        return false;
      }
      
      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        newErrors.push(`${file.name}: File exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      
      return true;
    });

    // Check max files
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
      validFiles.splice(maxFiles - files.length);
    }

    setErrors(newErrors);
    setFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileCategories(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  const setFileCategory = (index: number, category: DocumentCategory) => {
    setFileCategories(prev => {
      const newMap = new Map(prev);
      newMap.set(index, category);
      return newMap;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const uploaded: UploadedFile[] = [];
    const uploadErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = caseId 
        ? `${userId}/${caseId}/${timestamp}_${sanitizedName}`
        : `${userId}/${timestamp}_${sanitizedName}`;

      try {
        const { data, error } = await supabase.storage
          .from('case-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        uploaded.push({
          name: file.name,
          path: data.path,
          size: file.size,
          type: file.type,
          category: fileCategories.get(i) || 'general'
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.error('Upload error:', error);
        uploadErrors.push(`${file.name}: Upload failed`);
      }
    }

    setIsUploading(false);
    setFiles([]);
    setFileCategories(new Map());
    setUploadedFiles(prev => [...prev, ...uploaded]);
    
    if (uploadErrors.length > 0) {
      setErrors(uploadErrors);
      toast({
        title: "Some uploads failed",
        description: `${uploaded.length} of ${files.length} files uploaded successfully.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Upload complete",
        description: `${uploaded.length} file(s) uploaded successfully.`
      });
    }

    if (onUploadComplete && uploaded.length > 0) {
      onUploadComplete(uploaded);
    }
  };

  const removeUploadedFile = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('case-documents')
        .remove([path]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.path !== path));
      toast({
        title: "File removed",
        description: "The document has been deleted."
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not remove the file.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload supporting documents for your case (max {maxFiles} files, {maxSizeMB}MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept={allowedTypes.join(',')}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to browse or drag and drop files
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Word, images (JPEG, PNG, WebP), or text files
          </p>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {errors.map((error, idx) => (
              <p key={idx} className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected files:</p>
            {files.map((file, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {showCategories && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Category:</Label>
                    <DocumentCategorySelect
                      value={fileCategories.get(idx) || 'general'}
                      onValueChange={(cat) => setFileCategory(idx, cat)}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>
            ))}

            {isUploading ? (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : (
              <Button onClick={handleUpload} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file{files.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploaded documents:</p>
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {getFileIcon(file.type)}
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(file.path)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
