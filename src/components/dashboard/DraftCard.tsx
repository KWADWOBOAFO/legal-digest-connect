import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Pencil, Trash2, ArrowRight, Clock, AlertTriangle, Plus, Copy, Search, SortAsc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Draft,
  getDrafts,
  updateDraft,
  deleteDraft,
  duplicateDraft,
  isDraftExpiring,
  getDraftAge,
  migrateOldDraft,
  runStartupCleanup,
} from "@/lib/draftUtils";

const practiceAreas = [
  "Family Law",
  "Personal Injury",
  "Criminal Defense",
  "Business Law",
  "Real Estate",
  "Employment Law",
  "Immigration",
  "Estate Planning",
  "Intellectual Property",
  "Other",
];

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "practice-area";

const sortLabels: Record<SortOption, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "title-asc": "Title (A-Z)",
  "title-desc": "Title (Z-A)",
  "practice-area": "Practice Area",
};

const DraftCard = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editedDraft, setEditedDraft] = useState<Partial<Draft>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Migrate old single draft format
    migrateOldDraft();
    
    // Run cleanup on startup
    const { removedCount } = runStartupCleanup();
    if (removedCount > 0) {
      toast({
        title: "Expired drafts removed",
        description: `${removedCount} draft${removedCount > 1 ? "s" : ""} older than 60 days ${removedCount > 1 ? "were" : "was"} automatically removed.`,
      });
    }
    
    loadDrafts();
  }, [toast]);

  const loadDrafts = () => {
    setDrafts(getDrafts());
  };

  const handleEdit = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditedDraft(draft);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedDraft) return;
    
    updateDraft(selectedDraft.id, {
      title: editedDraft.title,
      description: editedDraft.description,
      practiceArea: editedDraft.practiceArea,
    });
    
    loadDrafts();
    setIsEditDialogOpen(false);
    setSelectedDraft(null);
    toast({
      title: "Draft updated",
      description: "Your changes have been saved.",
    });
  };

  const handleDeleteClick = (draft: Draft) => {
    setSelectedDraft(draft);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedDraft) return;
    
    deleteDraft(selectedDraft.id);
    loadDrafts();
    setDeleteDialogOpen(false);
    setSelectedDraft(null);
    toast({
      title: "Draft deleted",
      description: "Your draft has been removed.",
    });
  };

  const handleDuplicate = (draft: Draft) => {
    const duplicated = duplicateDraft(draft.id);
    if (duplicated) {
      loadDrafts();
      toast({
        title: "Draft duplicated",
        description: `"${duplicated.title}" has been created.`,
      });
    }
  };

  const handleContinueToSubmission = (draft: Draft) => {
    navigate("/submit-case", {
      state: {
        prefill: {
          title: draft.title,
          description: draft.description,
          practiceArea: draft.practiceArea,
        },
        draftId: draft.id,
      },
    });
  };

  const getPracticeAreaLabel = (value: string) => {
    const area = practiceAreas.find(
      (a) => a.toLowerCase().replace(/\s+/g, "-") === value
    );
    return area || value;
  };

  // Filter drafts based on search query
  const filteredDrafts = drafts.filter((draft) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      draft.title.toLowerCase().includes(query) ||
      draft.description.toLowerCase().includes(query) ||
      getPracticeAreaLabel(draft.practiceArea).toLowerCase().includes(query)
    );
  });

  // Sort filtered drafts
  const sortedDrafts = [...filteredDrafts].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "date-asc":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "title-asc":
        return (a.title || "Untitled").localeCompare(b.title || "Untitled");
      case "title-desc":
        return (b.title || "Untitled").localeCompare(a.title || "Untitled");
      case "practice-area":
        return getPracticeAreaLabel(a.practiceArea).localeCompare(
          getPracticeAreaLabel(b.practiceArea)
        );
      default:
        return 0;
    }
  });

  if (drafts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No saved drafts</p>
          <p className="text-muted-foreground text-xs mt-1">
            Start a case submission and your progress will be saved automatically
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/submit-case")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Case
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <SortAsc className="h-4 w-4 mr-2" />
              {sortLabels[sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setSortBy(option)}
                className={sortBy === option ? "bg-accent" : ""}
              >
                {sortLabels[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Empty state for search */}
      {sortedDrafts.length === 0 && searchQuery && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">No drafts match "{searchQuery}"</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drafts list */}
      <div className="space-y-4">
        {sortedDrafts.map((draft) => {
          const isExpiring = isDraftExpiring(draft);
          const ageInDays = getDraftAge(draft);

          return (
            <Card
              key={draft.id}
              className={`animate-fade-in transition-all ${
                isExpiring
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-accent/20 bg-accent/5"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isExpiring ? "bg-destructive/20" : "bg-accent/20"
                      }`}
                    >
                      {isExpiring ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <FileText className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {draft.title || "Untitled Draft"}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Last edited {new Date(draft.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpiring && (
                      <Badge variant="destructive" className="text-xs">
                        Expires soon
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isExpiring && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">
                        This draft is {ageInDays} days old
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Drafts older than 30 days may be automatically removed. Continue your
                        submission to preserve your work.
                      </p>
                    </div>
                  </div>
                )}

                {draft.practiceArea && (
                  <Badge variant="outline" className="text-xs">
                    {getPracticeAreaLabel(draft.practiceArea)}
                  </Badge>
                )}
                
                {draft.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {draft.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleContinueToSubmission(draft)}
                    className="flex-1"
                  >
                    Continue Submission
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(draft)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(draft)}
                    title="Duplicate draft"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(draft)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
            <DialogDescription>
              Make changes to your saved draft before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editedDraft.title || ""}
                onChange={(e) =>
                  setEditedDraft({ ...editedDraft, title: e.target.value })
                }
                placeholder="Brief title for your legal matter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-practice-area">Practice Area</Label>
              <Select
                value={editedDraft.practiceArea || ""}
                onValueChange={(value) =>
                  setEditedDraft({ ...editedDraft, practiceArea: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem
                      key={area}
                      value={area.toLowerCase().replace(/\s+/g, "-")}
                    >
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedDraft.description || ""}
                onChange={(e) =>
                  setEditedDraft({ ...editedDraft, description: e.target.value })
                }
                placeholder="Describe your legal situation..."
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDraft?.title || "Untitled Draft"}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DraftCard;
