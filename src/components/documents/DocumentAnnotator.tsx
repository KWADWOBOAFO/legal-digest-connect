import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, PencilBrush, FabricObject } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Eraser, 
  Save,
  Undo,
  Redo,
  MousePointer,
  Palette,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type AnnotationTool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'eraser';

interface DocumentAnnotatorProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  documentPath: string;
  documentType?: string;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#000000'
];

export function DocumentAnnotator({
  isOpen,
  onClose,
  documentId,
  documentName,
  documentPath,
  documentType
}: DocumentAnnotatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const isPdf = documentType?.includes('pdf');
  const isImage = documentType?.startsWith('image/');

  useEffect(() => {
    if (isOpen) {
      loadDocument();
    }
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [isOpen, documentPath]);

  useEffect(() => {
    if (!canvasRef.current || !documentUrl || !isOpen) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: activeTool === 'select',
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);

    // For images, we'll display the image behind the canvas via CSS
    setIsLoading(false);
    saveToHistory(canvas);

    // Load existing annotations
    loadAnnotations(canvas);

    return () => {
      canvas.dispose();
    };
  }, [documentUrl, isOpen]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    fabricCanvas.selection = activeTool === 'select';
    
    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    }

    if (activeTool === 'eraser') {
      fabricCanvas.on('mouse:down', handleEraser);
    } else {
      fabricCanvas.off('mouse:down', handleEraser);
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(documentPath, 3600);

      if (error) throw error;
      setDocumentUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: 'Load failed',
        description: 'Could not load the document for annotation.',
        variant: 'destructive'
      });
    }
  };

  const loadAnnotations = async (canvas: FabricCanvas) => {
    try {
      const { data, error } = await supabase
        .from('document_annotations')
        .select('*')
        .eq('document_id', documentId)
        .eq('page_number', currentPage);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(annotation => {
          const objData = annotation.annotation_data as any;
          if (objData) {
            canvas.loadFromJSON({ objects: [objData] }, () => {
              canvas.renderAll();
            });
          }
        });
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };

  const saveToHistory = (canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleEraser = (e: any) => {
    const target = fabricCanvas?.findTarget(e.e);
    if (target) {
      fabricCanvas?.remove(target);
      fabricCanvas?.renderAll();
    }
  };

  const handleToolClick = (tool: AnnotationTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        width: 100,
        height: 80,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      saveToHistory(fabricCanvas);
      setActiveTool('select');
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      saveToHistory(fabricCanvas);
      setActiveTool('select');
    } else if (tool === 'text') {
      const text = new IText('Add text here', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 20,
        fontFamily: 'Arial',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      text.enterEditing();
      saveToHistory(fabricCanvas);
      setActiveTool('select');
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0 && fabricCanvas) {
      const newIndex = historyIndex - 1;
      fabricCanvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
        fabricCanvas.renderAll();
        setHistoryIndex(newIndex);
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && fabricCanvas) {
      const newIndex = historyIndex + 1;
      fabricCanvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
        fabricCanvas.renderAll();
        setHistoryIndex(newIndex);
      });
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.getObjects().forEach(obj => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.renderAll();
    saveToHistory(fabricCanvas);
  };

  const handleSave = async () => {
    if (!fabricCanvas || !user) return;

    setIsSaving(true);
    try {
      // Delete existing annotations for this page
      await supabase
        .from('document_annotations')
        .delete()
        .eq('document_id', documentId)
        .eq('page_number', currentPage);

      // Save each object as an annotation
      const objects = fabricCanvas.getObjects();
      
      for (const obj of objects) {
        const annotationType = getAnnotationType(obj);
        await supabase
          .from('document_annotations')
          .insert({
            document_id: documentId,
            page_number: currentPage,
            annotation_type: annotationType,
            annotation_data: obj.toJSON(),
            color: activeColor,
            created_by: user.id
          });
      }

      toast({
        title: 'Annotations saved',
        description: 'Your annotations have been saved successfully.'
      });
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save annotations.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAnnotationType = (obj: FabricObject): string => {
    if (obj.type === 'path') return 'drawing';
    if (obj.type === 'rect') return 'shape';
    if (obj.type === 'circle') return 'shape';
    if (obj.type === 'i-text' || obj.type === 'text') return 'text';
    return 'drawing';
  };

  const handleZoomIn = () => {
    if (fabricCanvas && zoom < 200) {
      const newZoom = zoom + 25;
      setZoom(newZoom);
      fabricCanvas.setZoom(newZoom / 100);
      fabricCanvas.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (fabricCanvas && zoom > 50) {
      const newZoom = zoom - 25;
      setZoom(newZoom);
      fabricCanvas.setZoom(newZoom / 100);
      fabricCanvas.renderAll();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Annotate: {documentName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-shrink-0 overflow-x-auto">
          {/* Selection Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('select')}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolClick('draw')}
              title="Draw"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'rectangle' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolClick('rectangle')}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'circle' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolClick('circle')}
              title="Circle"
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'text' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolClick('text')}
              title="Text"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'eraser' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolClick('eraser')}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Color">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: activeColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      activeColor === color ? 'border-primary' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* History */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              title="Clear All"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Save */}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4"
        >
          {isLoading ? (
            <Skeleton className="w-[800px] h-[600px]" />
          ) : isPdf ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe 
                  src={`${documentUrl}#toolbar=0`}
                  className="w-[800px] h-[600px] border-0"
                  title={documentName}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                PDF annotation: Use the overlay canvas to draw on top of the document
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
              {isImage && documentUrl && (
                <img 
                  src={documentUrl} 
                  alt={documentName}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              <canvas ref={canvasRef} className="relative z-10" />
            </div>
          )}
        </div>

        {/* Page Navigation for PDFs */}
        {isPdf && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 px-4 py-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
