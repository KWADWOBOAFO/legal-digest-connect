import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Eye, 
  Download, 
  Share2, 
  History,
  MoreVertical,
  Pencil
} from 'lucide-react';
import { DocumentThumbnail } from './DocumentThumbnail';
import { getCategoryBadge, type DocumentCategory } from './DocumentCategorySelect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DraggableDocument {
  id: string;
  name: string;
  path: string;
  type?: string;
  category?: DocumentCategory;
  displayOrder: number;
  versionCount?: number;
}

interface SortableDocumentItemProps {
  document: DraggableDocument;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (doc: DraggableDocument) => void;
  onDownload: (doc: DraggableDocument) => void;
  onShare?: (doc: DraggableDocument) => void;
  onVersionHistory?: (doc: DraggableDocument) => void;
  onAnnotate?: (doc: DraggableDocument) => void;
  showActions: boolean;
}

function SortableDocumentItem({
  document,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onShare,
  onVersionHistory,
  onAnnotate,
  showActions
}: SortableDocumentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-muted/50 rounded-lg border transition-all",
        isDragging && "opacity-50 shadow-lg z-50",
        isSelected && "border-primary bg-primary/5"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(document.id)}
      />

      <DocumentThumbnail
        path={document.path}
        type={document.type}
        name={document.name}
        className="w-12 h-12"
        onClick={() => onPreview(document)}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{document.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {document.type?.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
          {getCategoryBadge(document.category)}
          {document.versionCount && document.versionCount > 1 && (
            <Badge variant="outline" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              v{document.versionCount}
            </Badge>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(document)}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(document)}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onShare && (
                <DropdownMenuItem onClick={() => onShare(document)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              {onVersionHistory && (
                <DropdownMenuItem onClick={() => onVersionHistory(document)}>
                  <History className="h-4 w-4 mr-2" />
                  Version History
                </DropdownMenuItem>
              )}
              {onAnnotate && (
                <DropdownMenuItem onClick={() => onAnnotate(document)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Annotate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

interface DraggableDocumentListProps {
  documents: DraggableDocument[];
  onReorder: (documents: DraggableDocument[]) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onPreview: (doc: DraggableDocument) => void;
  onDownload: (doc: DraggableDocument) => void;
  onShare?: (doc: DraggableDocument) => void;
  onVersionHistory?: (doc: DraggableDocument) => void;
  onAnnotate?: (doc: DraggableDocument) => void;
  showActions?: boolean;
}

export function DraggableDocumentList({
  documents,
  onReorder,
  selectedIds,
  onSelectionChange,
  onPreview,
  onDownload,
  onShare,
  onVersionHistory,
  onAnnotate,
  showActions = true
}: DraggableDocumentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = documents.findIndex((d) => d.id === active.id);
      const newIndex = documents.findIndex((d) => d.id === over.id);
      
      const reordered = arrayMove(documents, oldIndex, newIndex).map((doc, index) => ({
        ...doc,
        displayOrder: index
      }));
      
      onReorder(reordered);
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(documents.map(d => d.id)));
    }
  };

  return (
    <div className="space-y-2">
      {documents.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Checkbox
            checked={selectedIds.size === documents.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0 
              ? `${selectedIds.size} selected` 
              : 'Select all'
            }
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={documents.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {documents.map((doc) => (
              <SortableDocumentItem
                key={doc.id}
                document={doc}
                isSelected={selectedIds.has(doc.id)}
                onSelect={handleSelect}
                onPreview={onPreview}
                onDownload={onDownload}
                onShare={onShare}
                onVersionHistory={onVersionHistory}
                onAnnotate={onAnnotate}
                showActions={showActions}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
