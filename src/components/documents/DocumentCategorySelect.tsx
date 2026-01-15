import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Scale, 
  Mail, 
  DollarSign, 
  User, 
  Folder 
} from 'lucide-react';

export type DocumentCategory = 'contracts' | 'evidence' | 'correspondence' | 'financial' | 'identification' | 'general';

interface DocumentCategorySelectProps {
  value: DocumentCategory;
  onValueChange: (value: DocumentCategory) => void;
  disabled?: boolean;
}

const categories: { value: DocumentCategory; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'contracts', label: 'Contracts', icon: FileText, description: 'Agreements, contracts, legal documents' },
  { value: 'evidence', label: 'Evidence', icon: Scale, description: 'Photos, recordings, proof materials' },
  { value: 'correspondence', label: 'Correspondence', icon: Mail, description: 'Emails, letters, communications' },
  { value: 'financial', label: 'Financial', icon: DollarSign, description: 'Invoices, statements, receipts' },
  { value: 'identification', label: 'Identification', icon: User, description: 'IDs, licenses, certificates' },
  { value: 'general', label: 'General', icon: Folder, description: 'Other supporting documents' },
];

export function DocumentCategorySelect({ 
  value, 
  onValueChange, 
  disabled 
}: DocumentCategorySelectProps) {
  const selectedCategory = categories.find(c => c.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category">
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <selectedCategory.icon className="h-4 w-4" />
              {selectedCategory.label}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            <div className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <div>
                <div className="font-medium">{category.label}</div>
                <div className="text-xs text-muted-foreground">{category.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCategoryBadge(category: DocumentCategory | string | undefined) {
  const cat = categories.find(c => c.value === category) || categories.find(c => c.value === 'general')!;
  const Icon = cat.icon;
  
  const colors: Record<DocumentCategory, string> = {
    contracts: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200',
    evidence: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200',
    correspondence: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
    financial: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200',
    identification: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200',
    general: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200',
  };

  return (
    <Badge className={colors[cat.value as DocumentCategory] || colors.general}>
      <Icon className="h-3 w-3 mr-1" />
      {cat.label}
    </Badge>
  );
}

export { categories as documentCategories };
