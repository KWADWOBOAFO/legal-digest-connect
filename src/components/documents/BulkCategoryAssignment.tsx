import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentCategorySelect, type DocumentCategory } from './DocumentCategorySelect';
import { FolderOpen, Tag } from 'lucide-react';

interface BulkCategoryAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onAssign: (category: DocumentCategory) => void;
  isLoading?: boolean;
}

export function BulkCategoryAssignment({
  isOpen,
  onClose,
  selectedCount,
  onAssign,
  isLoading = false
}: BulkCategoryAssignmentProps) {
  const [category, setCategory] = useState<DocumentCategory>('general');

  const handleAssign = () => {
    onAssign(category);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Assign Category
          </DialogTitle>
          <DialogDescription>
            Assign a category to {selectedCount} selected document{selectedCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{selectedCount} document{selectedCount !== 1 ? 's' : ''}</p>
              <p className="text-sm text-muted-foreground">Will be assigned to the selected category</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <DocumentCategorySelect
              value={category}
              onValueChange={setCategory}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? 'Assigning...' : 'Assign Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
